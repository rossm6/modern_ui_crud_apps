/* 

    Must support -

        1. Server side and client side pagination, sorting and filtering

*/

import React, { useState, useEffect } from "react";

const Table = ({
    fetchData,
    orderBy,
    columns,
    data
}) => {

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

    const [orderByState, setOrderByState] = useState(orderBy || []);

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
        return colIndex in getOrdableColumns();
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
            colOrder.dir
            let newDirIndex = (orderings.indexOf(colOrder.dir) + 1) % 3;
            let newDir = orderings[newDirIndex];
            let newOrdering = orderByState.map(o => ({ ...o }));
            colOrder.dir = newDir;
            newOrdering.splice(index, 1, colOrder);
            setOrderByState(newOrdering); // change Table Component state
        }
    };

    useEffect(() => {
        console.log("call use effect");
        fetchData()
    }, [orderByState]);
    // component state variables should change ref when updating using the setter
    // good article - https://www.benmvp.com/blog/object-array-dependencies-react-useEffect-hook/

    const getColDataKeys = () => {
        return columns.map(c => c.dataKey);
    };

    const getRows = (rows) => {
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

    console.log("data", rows);

    return (
        <div>
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((column, colIndex) => (
                            <th
                                key={colIndex}
                                onClick={isOrdable(colIndex) ? getOrdableCallback(colIndex) : undefined}
                                className={isOrdable(colIndex) ? "cursor-pointer" : undefined}
                            >
                                <span>
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
                                <td key={i}>{cellValue}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

};

export default Table;