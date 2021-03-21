import React, { useLayoutEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import debounce from "lodash.debounce";


const useWindowSize = () => {
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
        const updateSize = () => {
            setSize([window.innerWidth, window.innerHeight]);
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => {
            window.removeEventListener('resize', updateSize);
        }
    }, []);
    return size;
};


const InfiniteScroll = ({ query, children, pageSize }) => {
    // Sources - 
    // for cloning  - https://stackoverflow.com/a/35102287
    const [width, height] = useWindowSize();
    const { loading, data, fetchMore, error } = useQuery(query, { variables: { first: pageSize } });

    // TODO -
    // How to best handle network and server side errors?
    // At least we want to display a "Something went wrong" message
    // If there any problems.

    var containerRef = useRef(null);

    // fetchMore on scroll
    useLayoutEffect(() => {
        if (containerRef.current) {
            const container = containerRef.current;
            const containerParent = container.parentElement;
            let func = debounce(() => {
                console.log("bouncey, bouncey!");
                const lastPageInfo = data?.viewer.squares.pageInfo;
                if (loading || error || (lastPageInfo && !lastPageInfo.hasNextPage)) {
                    return // bail out like in prefill
                }
                if (containerParent.offsetHeight + containerParent.scrollTop >= containerParent.scrollHeight - 50) {
                    fetchMore({
                        variables: {
                            first: pageSize,
                            after: lastPageInfo?.endCursor
                        }
                    });
                }
            }, 100);
            containerParent.addEventListener('scroll', func);
            return () => {
                containerParent.removeEventListener('scroll', func);
            }
        }
    });


    // prefill
    useLayoutEffect(() => {
        // keep fetching more until the container has a scrollbar
        const container = containerRef.current;
        const containerParent = container.parentElement;
        const lastPageInfo = data?.viewer.squares.pageInfo;
        if (loading || (container.offsetHeight > containerParent.offsetHeight) || (lastPageInfo && !lastPageInfo.hasNextPage)) {
            return; // bail out
        }
        fetchMore({
            variables: {
                first: pageSize,
                after: lastPageInfo?.endCursor
            }
        })
    });


    return (
        <div ref={containerRef} className="infinite-scroll-container">
            {
                React.cloneElement(children, { squares: data?.viewer.squares })
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