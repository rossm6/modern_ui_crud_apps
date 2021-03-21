import React, { useLayoutEffect, useRef } from "react";
import { useQuery } from "@apollo/client";
import debounce from "lodash.debounce";
import { ref } from "yup";

const InfiniteScroll = ({ query, children, pageSize }) => {
    // Sources - 
    // for cloning  - https://stackoverflow.com/a/35102287

    const { loading, data, fetchMore, error } = useQuery(query, { variables: { first: pageSize } });

    var containerRef = useRef(null);

    // fetchMore on scroll
    useLayoutEffect(() => {
        console.log("DUH!!!");
        if (containerRef.current) {
            console.log("oh yeah");
            const container = containerRef.current;
            const containerParent = container.parentElement;
            console.log(containerParent);
            let func = debounce(() => {
                console.log("bouncey, bouncey!");
                const lastPageInfo = data?.viewer.squares.pageInfo;
                if (loading || error || (lastPageInfo && !lastPageInfo.hasNextPage)) {
                    console.log("bail", loading, error, lastPageInfo);
                    return // bail out like in prefill
                };
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