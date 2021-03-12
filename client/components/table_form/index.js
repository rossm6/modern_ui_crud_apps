import React from 'react';
import ReactDOM from "react-dom";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import { useTable, useSortBy } from 'react-table'
import styled from 'styled-components'

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

const client = new ApolloClient({
    uri: "http://localhost:8000/graphql",
    cache: new InMemoryCache()
});

const Styles = styled.div`
    table {
        border: 1px solid #ccc;
        border-collapse: collapse;
        margin: 0;
        padding: 0;
        width: 100%;
        table-layout: fixed;
    }

    table caption {
        font-size: 1.5em;
        margin: .5em 0 .75em;
    }

    table tr {
        border: 1px solid #ddd;
        padding: .35em;
    }

    table th,
    table td {
        padding: .625em;
        text-align: center;
    }

    table th {
        font-size: .85em;
        letter-spacing: .1em;
        text-transform: uppercase;
    }

    @media screen and (max-width: 575px) {
    table {
        border: 0;
    }

    table th {
        display: block;
    }

    table caption {
        font-size: 1.3em;
    }

    table tr {
        border-bottom: 3px solid #ddd;
        display: block;
        margin-bottom: .625em;
    }

    table td {
        border-bottom: 1px solid #ddd;
        display: block;
        font-size: .8em;
        text-align: right;
    }

    table td::before {
        /*
        * aria-label has no advantage, it won't be read inside a table
        content: attr(aria-label);
        */
        content: attr(data-label);
        float: left;
        font-weight: bold;
        text-transform: uppercase;
    }

    table td:last-child {
        border-bottom: 0;
    }
`;

function Table({ columns, data }) {
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable({ columns, data }, useSortBy);

    return (
        <>
            <table {...getTableProps()}>
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                // Add the sorting props to control sorting. For this example
                                // we can add them into the header props
                                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                    {column.render('Header')}
                                    {/* Add a sort direction indicator */}
                                    <span>
                                        {column.isSorted
                                            ? column.isSortedDesc
                                                ? <i class="bi bi-caret-down-fill"></i>
                                                : <i class="bi bi-caret-up-fill"></i>
                                            : ''}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map(row => {
                        prepareRow(row)
                        return (
                            <tr {...row.getRowProps()}>
                                {
                                    row.cells.map(cell => {
                                        return (
                                            <td {...cell.getCellProps([{ "data-label": cell.column.Header.toLowerCase() }])}>
                                                {cell.render('Cell')}
                                            </td>
                                        )
                                    })
                                }
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            <br />
        </>
    )
}

function App() {
    const data = React.useMemo(
        () => [
            {
                col1: 1,
                col2: "1 Apr 2021",
                col3: "1 day",
                col4: "2 Apr 2021",
                col5: "lease",
                col6: "100.50"
            },
            {
                col1: 2,
                col2: "2 Apr 2021",
                col3: "1 day",
                col4: "3 Apr 2021",
                col5: "sale",
                col6: "113.50"
            }
        ],
        []
    );

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

    return (
        <Styles>
            <div className="d-sm-none text-right">
                <h1 className="h4"><i class="bi bi-filter-circle"></i></h1>
            </div>
            <Table columns={columns} data={data} />
        </Styles>
    )
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);