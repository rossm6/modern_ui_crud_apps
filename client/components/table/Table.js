import React, { useState, useEffect, useRef } from "react";
import { Form, Pagination, Row, Col } from "react-bootstrap";
import PropTypes from 'prop-types';


/* 

    I think it would be much nicer if we just had one state object
    for ordering, data and pagination.  This makes the component so much
    easier to write.


        App

    Form    Table

    Form sets state on app with formData.
    This causes a re-render.
    FormData is passed to Table.  It checks if it is different
    to last formData (ref).  If so it updates it's own state.
    Question - Does this second update abort the first?
    I'm hoping it does.

*/

const Table = ({
    fetchData,
    orderBy,
    columns,
    data,
    usePagination,
    totalPages,
    totalCount,
    form,
    formErrors,
}) => {

    const ordPrefRef = useRef(columns.length);
    // when a column is ordered i.e. changed from "" to "asc" or "desc"
    // give the column an order of orderPrefRef
    // then increment it

    const orderings = ["", "asc", "desc"];

    /*

        <Table
            orderBy=[
                {"col": 0, "dir": "asc", "order": 0},
                {"col": 1, "dir": "desc", "order": 1}
            ]
        />
    
    */

    const getOrdableColumns = () => {
        return (orderBy || []).map(o => o.col);
    };

    const defaultPageInfo = {
        pageIndex: 0
    };

    if (usePagination) {
        defaultPageInfo.pageSize = 10;
    }

    const getInitialPaginationInfo = (totalPages) => {
        let currentPageIndex = defaultPageInfo.pageIndex;
        let pageSize = defaultPageInfo.pageSize;
        return {
            meta: {
                used: false
            },
            info: {
                pageSize: pageSize,
                pageIndex: currentPageIndex,
                canNextPage: currentPageIndex + 1 < totalPages - 1,
                canPreviousPage: currentPageIndex - 1 > 0,
            }
        }
    };

    const initialPaginiationInfo = useRef(false); // this is updated with page info
    // after first return from the server
    // afterwards this is never used again
    // because going forward pagination state changes are driven by the user
    // clicking the page buttons
    if (!initialPaginiationInfo.current && totalPages) {
        initialPaginiationInfo.current = getInitialPaginationInfo(totalPages);
    }

    const [pagination, setPagination] = useState({ ...defaultPageInfo, initial: true });
    const [orderByState, setOrderByState] = useState(orderBy || []);


    const getPaginationInfo = () => {
        // for the first data render pagination state is empty
        // so we use initialPaginationInfo instead
        // going forward user will drive changes to pagination state
        // by clicking page buttons
        if (!initialPaginiationInfo.current.used) {
            initialPaginiationInfo.current.used = true;
            return initialPaginiationInfo.current.info;
        }
        return pagination;
    };

    const _setPagination = (newPageIndex) => {
        // use this to call setPagination always
        let paginationInfo;
        if (pagination.initial) {
            // then we've not updated the pagination state yet
            // since the first data returned from the server
            paginationInfo = initialPaginiationInfo.current.info;
        }
        else {
            paginationInfo = pagination;
        }
        setPagination({
            ...paginationInfo,
            pageIndex: newPageIndex
        });
    };

    const goToPage = (pageIndex) => {
        let pageToGoTo;
        if (pageIndex < 0) {
            pageToGoTo = 0;
        }
        else if (pageIndex + 1 > totalPages) {
            pageToGoTo = totalPages - 1;
        }
        else {
            pageToGoTo = pageIndex;
        }
        _setPagination(pageToGoTo);
    };

    const previousPage = () => {
        const currentPageIndex = pagination.pageIndex;
        const previousPageIndex = currentPageIndex - 1 >= 0 ? currentPageIndex - 1 : undefined;
        _setPagination(previousPageIndex);
    };

    const nextPage = () => {
        const currentPageIndex = pagination.pageIndex;
        const nextPageIndex = currentPageIndex + 1 <= totalPages - 1 ? currentPageIndex + 1 : undefined;
        _setPagination(nextPageIndex);
    };

    const getOrderDir = (colIndex) => {
        let f = orderByState.find((o) => o.col == colIndex);
        let dir = f.dir;
        if (dir == "") {
            return undefined
        }
        if (dir == "asc") {
            return <i className="bi bi-caret-up-fill"></i>
        }
        if (dir == "desc") {
            return <i className="bi bi-caret-down-fill"></i>
        }
    };

    const isOrdable = (colIndex) => {
        return getOrdableColumns().indexOf(colIndex) != -1
    };

    const getOrdableCallback = (colIndex) => {
        return () => {
            let index;
            let colOrder;
            orderByState.forEach((o, i) => {
                if (o.col == colIndex) {
                    colOrder = { ...o };
                    index = i;
                    return;
                }
            });
            let newDirIndex = (orderings.indexOf(colOrder.dir) + 1) % 3;
            let newDir = orderings[newDirIndex];
            let newOrdering = orderByState.map(o => ({ ...o }));
            if (!colOrder.dir) {
                // this col was not being ordered and now is
                // we must respect order precedence i.e. those already chosen to be ordered must come first
                // so change order index to orderPrefRef
                colOrder.order = ordPrefRef.current;
                ordPrefRef.current = ordPrefRef.current + 1;
            }
            colOrder.dir = newDir;
            newOrdering.splice(index, 1, colOrder);
            setOrderByState(newOrdering); // change Table Component state
        }
    };


    const getFieldNameForOrdering = React.useCallback((colIndex) => {
        const col = columns.find((c, i) => colIndex == i);
        return col.orderKey || col.dataKey;
    }, [columns])


    const getOrderByForServer = React.useCallback(
        (orderByState) => {
            const columnsToOrder = orderByState.filter((o) => o.dir);
            const columnsToOrderInOrder = columnsToOrder.sort((a, b) => {
                return a.order - b.order;
            });
            console.log(columnsToOrderInOrder);
            return columnsToOrderInOrder.map((o) => {
                return {
                    field: getFieldNameForOrdering(o.col),
                    dir: o.dir
                }
            });
        },
        [getFieldNameForOrdering]
    );

    const filters = useRef({});

    const applyFilters = (formData) => {
        filters.current = formData;
        setPagination({
            ...pagination,
            pageIndex: 0
        });
    };

    useEffect(() => {
        fetchData({
            orderBy: getOrderByForServer(orderByState),
            pageSize: pagination.pageSize,
            pageIndex: pagination.pageIndex,
            formData: filters.current
        })
    }, [fetchData, orderByState, getOrderByForServer, pagination, filters]);
    // component state variables should change ref when updating using the setter (they must do)
    // good article - https://www.benmvp.com/blog/object-array-dependencies-react-useEffect-hook/

    const getColDataKeys = () => {
        return columns.map(c => c.dataKey);
    };

    const getRows = (rows) => {
        /*
            For my needs I always pass the page of data
            to the table so we don't need to paginate / slice
            the data passed.

            For client side pagination we'd need to.
        */
        const dataKeys = getColDataKeys();
        let properRows = []; // because server side data might not be right order
        (rows || []).forEach((r) => {
            let o = [];
            dataKeys.forEach(k => {
                o.push(r[k]);
            });
            properRows.push(o);
        });
        return properRows;
    };

    const rows = getRows(data);

    const getPageButtons = (currentPageIndex, totalPages) => {
        let lastPageIndex = totalPages - 1;
        let pageIndexes = [];
        pageIndexes.push(0);
        const around = [-2, -1, 0, 1, 2];
        around.forEach((m) => {
            const pageIndex = currentPageIndex + m;
            if (pageIndex >= 0 && pageIndex <= lastPageIndex) {
                pageIndexes.push(pageIndex);
            }
        });
        if (lastPageIndex > 0) {
            pageIndexes.push(lastPageIndex);
        }
        // remove duplicate indexes
        const uniquePageIndexes = [...new Set(pageIndexes)];
        const onClickHandler = (pageIndex, currentIndex) => {
            const isCurrent = pageIndex == currentIndex;
            return () => {
                return !isCurrent && goToPage(pageIndex)
            };
        };
        uniquePageIndexes.sort((a, b) => a - b);
        if (uniquePageIndexes.length > 3) {
            // -1 has special meaning - will create an ellipsis button
            uniquePageIndexes.splice(1, 0, -1);
            uniquePageIndexes.splice(uniquePageIndexes.length - 1, 0, -1);
        }
        const buttons = [];
        uniquePageIndexes.forEach((pageIndex, index) => {
            let b;
            if (pageIndex == -1) {
                b = <Pagination.Ellipsis key={index} />;
            }
            else {
                b = <Pagination.Item
                    className={
                        pageIndex == currentPageIndex
                            || pageIndex == 0
                            || pageIndex == lastPageIndex
                            ? null
                            : "d-none d-md-block"
                    }
                    key={index} active={pageIndex == currentPageIndex}
                    onClick={onClickHandler(pageIndex, currentPageIndex)}>
                    {pageIndex + 1}
                </Pagination.Item>;
            }
            buttons.push(b);
        });
        return buttons;
    };

    const setPageSize = (pageSize) => {
        setPagination({
            ...pagination,
            pageSize
        });
    };

    // use this for rendering
    // it will use the info from the ref if this is the first render with data / totalPages defined
    // else it will give us the latest pagination state
    let paginationInfo;
    let canPreviousPage;
    let canNextPage;
    if (initialPaginiationInfo.current) {
        paginationInfo = getPaginationInfo();
        canPreviousPage = paginationInfo.pageIndex > 0;
        canNextPage = paginationInfo.pageIndex < totalPages - 1;
    }

    let CustomForm;
    if (form) {
        CustomForm = form;
    }

    return (
        <div>
            {CustomForm && <div>{<CustomForm setSubmissionData={applyFilters} formErrors={formErrors}/>}</div>}
            {paginationInfo && <div className="my-3">
                <Form.Control
                    className="w-auto"
                    as="select"
                    custom
                    value={paginationInfo.pageSize}
                    onChange={(e) => {
                        setPageSize(+e.target.value);
                    }}>
                    {
                        [10, 20, 30, 40, 50].map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                                Show {pageSize}
                            </option>
                        ))
                    }
                </Form.Control>
            </div>}
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((column, colIndex) => (
                            <th
                                key={colIndex}
                                onClick={isOrdable(colIndex) ? getOrdableCallback(colIndex) : undefined}
                                className={isOrdable(colIndex) ? "cursor-pointer" : undefined}
                            >
                                <span className="th-span">
                                    {column.label}
                                    {isOrdable(colIndex) && <span>{getOrderDir(colIndex)}</span>}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>
                            {row.map((cellValue, i) => (
                                <td data-label={columns[i].label.toLowerCase()} key={i}>{cellValue}</td>
                            ))}
                        </tr>
                    ))}
                    {totalPages ? null : <tr><td colSpan={columns.length}>Nothing found</td></tr>}
                </tbody>
            </table>
            <Row noGutters={true} className="mt-3">
                {<Col>
                    <span>Showing {rows.length} of {totalCount}</span>
                </Col>}
                {usePagination && totalPages ?
                    <Col>
                        <Pagination className="justify-content-center justify-content-md-end">
                            <Pagination.First
                                className="d-none d-md-block"
                                onClick={() => goToPage(0)}
                                disabled={!canPreviousPage}
                            />
                            <Pagination.Prev
                                onClick={() => previousPage()}
                                disabled={!canPreviousPage}
                            />
                            {getPageButtons(paginationInfo.pageIndex, totalPages, goToPage)}
                            <Pagination.Next
                                onClick={() => nextPage()}
                                disabled={!canNextPage}
                            />
                            <Pagination.Last
                                className="d-none d-md-block"
                                onClick={() => goToPage(totalPages - 1)}
                                disabled={!canNextPage}
                            />
                        </Pagination>
                    </Col>
                    :
                    null
                }
            </Row>
        </div>
    )

};

Table.propTypes = {
    columns: PropTypes.array,
    data: PropTypes.array,
    fetchData: PropTypes.func,
    totalPages: PropTypes.number,
    orderBy: PropTypes.array,
    usePagination: PropTypes.bool,
    totalCount: PropTypes.number,
    filters: PropTypes.object
};

export default Table;