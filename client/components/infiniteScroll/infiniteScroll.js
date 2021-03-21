import React from "react";
import { } from "@apollo/client";

const InfiniteScroll = ({ children }) => {
    // Sources - 
    // for cloning  - https://stackoverflow.com/a/35102287

    return (
        <div>
            {
                React.cloneElement(children[0], { onClick: () => {alert("clicked")} })
            }
        </div>
    )
};


export default InfiniteScroll;

/*

Usage -

    <InfiniteScroll query={SQUARE_LIST_QUERY}>
        <SquareList/>
    </InfiniteScroll

*/