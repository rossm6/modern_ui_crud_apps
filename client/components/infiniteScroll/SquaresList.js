import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import { useWindowSize } from "./Hooks";

const SquaresList = ({ squares }) => {

    const [width, height] = useWindowSize();
    const squareStyleRef = useRef({});
    const containerClassName = useRef("grid");
    const [initialLoad, setInitialLoad] = useState(false);

    const get_square_width = (offset = 0) => {
        var grid = document.getElementsByClassName(containerClassName.current)[0];
        var grid_width = grid.offsetWidth - offset;
        console.log("grid width", grid_width);
        var min_square_width = 100;
        var r = grid_width % min_square_width;
        var n = (grid_width - r) / min_square_width;
        var actual_square_width = min_square_width + r / n;
        actual_square_width = actual_square_width.toFixed(4);
        return actual_square_width;
    };

    const _reset = (offset) => {
        var actual_square_width = get_square_width(offset);
        // react automatically append "px" to numerical values
        return {
            "minWidth": +actual_square_width,
            "maxWidth": +actual_square_width,
            "width": +actual_square_width,
            "minHeight": +actual_square_width,
            "maxHeight": +actual_square_width,
            "height": +actual_square_width
        }
    };

    const reset = useRef((offset) => _reset(offset));

    // Without this the width of squares does not fit the browser width
    // after prefill is complete i.e. when the scrollbar appears
    useLayoutEffect(() => {
        if (!initialLoad) {
            const gridContainer = document.getElementsByClassName(containerClassName.current)[0];
            const infiniteScrollContainer = gridContainer.parentElement;
            const scrollableContainer = infiniteScrollContainer.parentElement;
            if (infiniteScrollContainer.offsetHeight > scrollableContainer.offsetHeight) {
                // i.e. prefill is complete
                setInitialLoad(true) // causes another render.  First after last prefill render.
            }
        }
    })

    useLayoutEffect(() => {
        squareStyleRef.current = reset.current()
    });

    return (
        <div className="grid d-flex flex-row flex-wrap">
            {squares && squares.edges.map((e, i) => (
                <div
                    style={squareStyleRef.current}
                    key={i}
                    className="small d-flex align-items-center justify-content-center h-100 w-100 bg-white text-primary"
                >
                    <div>{e.node.pk}</div>
                </div>
            ))}
        </div>
    )
};

export default SquaresList