import React from "react";

const SquaresList = ({squares}) => {

    return (
        <div>
            {squares && squares.edges.map((e, i) => (
                <div className="p-2 bg-danger" key={i}>{e.node.pk}</div>
            ))}
        </div>
    )
};

export default SquaresList