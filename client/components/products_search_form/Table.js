import React, { useEffect, useRef } from 'react';
import { useTable, useSortBy, usePagination } from "react-table";
import Pagination from "react-bootstrap/Pagination";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import isEqual from "lodash.isequal";
import PropTypes from 'prop-types';

function Table({
    columns,
    data,
    fetchData,
    loading,
    pageCount: controlledPageCount,
    total,
    filters
}) {
    const tableFilters = useRef({});
    const resetFilters = useRef(false);

    if(!isEqual(tableFilters.current, filters)){
        console.log("d1");
        console.log(tableFilters.current);
        console.log(filters);
        console.log("d2");
        tableFilters.current = filters;
        resetFilters.current = true;
    }
    else{
        resetFilters.current = false;
    }

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        page,
        canPreviousPage,
        canNextPage,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize, sortBy }
    } = useTable(
        {
            columns,
            data,
            manualPagination: true,
            manualSortBy: true,
            autoResetPage: false,
            autoResetSortBy: false,
            pageCount: controlledPageCount,
            useControlledState: state => {
                return React.useMemo(function(){
                    let controlledPageIndex;
                    if(resetFilters.current){
                        controlledPageIndex = 0;
                    }
                    else{
                        controlledPageIndex = state.pageIndex;
                    }
                    return {
                        ...state,
                        pageIndex: controlledPageIndex
                    }
                },
                [state, resetFilters.current]
                )
            }
        },
        useSortBy,
        usePagination
    );

    console.log("page index", pageIndex);

    useEffect(() => {
        if (!loading) {
            console.log("use effect fetch data");
            fetchData({ pageIndex, pageSize, sortBy, filters: tableFilters.current })
        }
    }, [loading, fetchData, pageIndex, pageSize, sortBy, tableFilters.current]);

    const getPageButtons = (currentPageIndex, lastPageIndex, gotoPage) => {
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
                return !isCurrent && gotoPage(pageIndex)
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

    // alert("ALERT - " + controlledPageCount);

    return (
        <>
            <div className="my-2">
                <Row>
                    <Col className="text-left" md="6">
                        <Form.Control className="w-auto" as="select" custom
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                            }}>
                            {[10, 20, 30, 40, 50].map((pageSize) => (
                                <option key={pageSize} value={pageSize}>
                                    Show {pageSize}
                                </option>
                            ))}
                        </Form.Control>
                    </Col>
                </Row>
            </div>
            <table {...getTableProps()} className="table">
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                // Add the sorting props to control sorting. For this example
                                // we can add them into the header props
                                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                    <span className="th-span">
                                        {column.render("Header")}
                                        {/* Add a sort direction indicator */}
                                        <span>
                                            {column.isSorted
                                                ? column.isSortedDesc
                                                    ? " 🔽"
                                                    : " 🔼"
                                                : ""}
                                        </span>
                                    </span>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {page.map((row) => {
                        prepareRow(row);
                        return (
                            <tr {...row.getRowProps()}>
                                {row.cells.map((cell) => {
                                    return (
                                        <td {...cell.getCellProps([{ "data-label": cell.column.Header.toLowerCase() }])}>
                                            {cell.render("Cell")}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    {loading && <tr><td colSpan="10000">Loading...</td></tr>}
                    {!total && <tr><td className="text-center" colSpan="10000">Nothing found...</td></tr>}
                </tbody>
            </table>
            <div className="mt-2 row">
                <div className="col-12 text-center text-md-left col-md-6">
                    <span>Showing {page.length} of {total}{" "} results</span>
                </div>
                <div className="mt-3 mt-md-0 col-12 col-md-6">
                    {controlledPageCount ? <Pagination className="justify-content-center justify-content-md-end">
                        <Pagination.First className="d-none d-md-block" onClick={() => gotoPage(0)} disabled={!canPreviousPage} />
                        <Pagination.Prev onClick={() => previousPage()} disabled={!canPreviousPage} />
                        {getPageButtons(pageIndex, controlledPageCount - 1, gotoPage)}
                        <Pagination.Next onClick={() => nextPage()} disabled={!canNextPage} />
                        <Pagination.Last className="d-none d-md-block" onClick={() => gotoPage(controlledPageCount - 1)} disabled={!canNextPage} />
                    </Pagination> : null}
                </div>
            </div>
        </>
    );
}

Table.propTypes = {
    columns: PropTypes.array,
    data: PropTypes.array,
    fetchData: PropTypes.func,
    loading: PropTypes.bool, 
    pageCount: PropTypes.number,
    total: PropTypes.number,
    filters: PropTypes.object
};

export default Table;