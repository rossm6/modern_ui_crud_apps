import React, { useState, useEffect } from 'react';
import { useTable, useSortBy, usePagination } from "react-table";
import { gql, useQuery } from "@apollo/client";

// page size is fixed at 5 to begin with

export const LOAD_PRODUCTS = gql`
  query LoadProducts ($first: Int, $after: String, $pageSize: Int) {
    viewer {
      id
      products (first: $first, after: $after) {
        edges {
          node {
            square {
                id
                pk
            }
            start
            duration
            end
            listing
            price
          }
          cursor
        }
        pages (pageSize: $pageSize) {
          first {
            cursor
            pageNumber
            isCurrent
          }
          last {
            cursor
            pageNumber
            isCurrent
          }
          around {
            cursor
            pageNumber
            isCurrent
          }
          previous {
            cursor
            pageNumber
            isCurrent
          }
        }
        totalPages
      }
    }
  }
`;

function Table({
    columns,
    data,
    onSort,
    fetchData,
    loading,
    pageCount: controlledPageCount
}) {
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        page,
        canPreviousPage,
        canNextPage,
        pageOptions,
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
            pageCount: controlledPageCount
        },
        useSortBy,
        usePagination
    );

    useEffect(() => {
        fetchData({ pageIndex, pageSize, sortBy });
    }, [sortBy, fetchData, pageIndex, pageSize]);

    console.log(data);

    return (
        <>
            <table {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                // Add the sorting props to control sorting. For this example
                                // we can add them into the header props
                                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                    {column.render("Header")}
                                    {/* Add a sort direction indicator */}
                                    <span>
                                        {column.isSorted
                                            ? column.isSortedDesc
                                                ? " 🔽"
                                                : " 🔼"
                                            : ""}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {page.map((row, i) => {
                        prepareRow(row);
                        return (
                            <tr {...row.getRowProps()}>
                                {row.cells.map((cell) => {
                                    return (
                                        <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    <tr>
                        {loading ? (
                            // Use our custom loading state to show a loading indicator
                            <td colSpan="10000">Loading...</td>
                        ) : (
                            <td colSpan="10000">
                                Showing {page.length} of ~{controlledPageCount * pageSize}{" "}
                  results
                            </td>
                        )}
                    </tr>
                </tbody>
            </table>
            <div className="pagination">
                <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                    {"<<"}
                </button>{" "}
                <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                    {"<"}
                </button>{" "}
                <button onClick={() => nextPage()} disabled={!canNextPage}>
                    {">"}
                </button>{" "}
                <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                    {">>"}
                </button>{" "}
                <span>
                    Page{" "}
                    <strong>
                        {pageIndex + 1} of {pageOptions.length}
                    </strong>{" "}
                </span>
                <span>
                    | Go to page:{" "}
                    <input
                        type="number"
                        defaultValue={pageIndex + 1}
                        onChange={(e) => {
                            const page = e.target.value ? Number(e.target.value) - 1 : 0;
                            gotoPage(page);
                        }}
                        style={{ width: "100px" }}
                    />
                </span>{" "}
                <select
                    value={pageSize}
                    onChange={(e) => {
                        setPageSize(Number(e.target.value));
                    }}
                >
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
}

function App() {
    const sortIdRef = React.useRef(0);
    const {
        loading,
        data,
        fetchMore
    } = useQuery(LOAD_PRODUCTS, {
        variables: {
            first: 10,
            after: ''
        }
    });

    const columns = React.useMemo(
        () => [
            {
                Header: 'Square',
                accessor: 'col1',
            },
            {
                Header: 'Start',
                accessor: 'col2'
            },
            {
                Header: 'Duration',
                accessor: 'col3'
            },
            {
                Header: 'End',
                accessor: 'col4'
            },
            {
                Header: 'Listing',
                accessor: 'col5'
            },
            {
                Header: 'Price',
                accessor: 'col6'
            }
        ]
    );


    const encodeCursor = (offset) => {
        // server implementation is -
        // def encode_cursor(index):
        // return b64encode(
        //     index.encode('utf8')
        // ).decode('ascii')
        // this is the JS equivalent
        const prefix = 'arrayconnection:'; // this is the prefix used by the graphene relay package on the server
        let cursor = prefix + offset;
        return decodeURI(btoa(encodeURI(cursor))); 
    };


    const getCursorFromOffset = (offset) => {
        if (offset == 0) return "";
        return encodeCursor(offset);
    };

    const fetchData = React.useCallback(({ pageSize, pageIndex, sortBy }) => {
        // This will get called when the table needs new data
        // You could fetch your data from literally anywhere,
        // even a server. But for this example, we'll just fake it.
        console.log("in fetch data", pageSize, pageIndex, sortBy);
        const offset = pageIndex ? pageIndex * pageSize - 1 : 0;
        fetchMore({
            variables: {
                first: pageSize,
                after: getCursorFromOffset(offset)
            }
        });
    }, []);

    const getTableData = (data) => {
        alert("get table data");
        const col_order = ["square", "start", "duration", "end", "listing", "price"];
        const table_data = [];
        data?.viewer.products.edges.forEach((edge, i) => {
            const o = {};
            col_order.forEach((key, i) => {
                o[`col${i + 1}`] = edge.node[key];
                if(key == "square"){
                    o[`col${i + 1}`] = edge.node[key]["pk"];
                }
            });
            table_data.push(o);
        });
        console.log("table data", table_data);
        return table_data;
    };

    const getPageCount = (data) => {
        const total_pages = data?.viewer.products.totalPages;
        console.log(total_pages);
        return total_pages || 0;
    };

    console.log("re render");

    return (
        <Table
            columns={columns}
            data={getTableData(data)}
            fetchData={fetchData}
            loading={loading}
            pageCount={getPageCount(data)}
        />
    );
}

export default App;