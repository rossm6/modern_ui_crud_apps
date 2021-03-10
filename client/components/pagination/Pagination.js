import React from 'react';
import Pagination from 'react-bootstrap/Pagination';

const PaginationButtonWrapper = (props) => {

    const changePage = () => {
        console.log(props);
        props.fetchMore({
            variables: {
                first: props.first,
                after: props.after
            }
        });
    };

    const PageButton = props.button;
    return (
        <>
            <PageButton onClick={changePage} key={props.key || null} active={props.active}>{props?.children}</PageButton>
        </>
    )
}

export default (props) => {
    const first = props.pages.first;
    const last = props.pages.last;
    const around = props.pages.around;
    const current = props.pages.around.filter((page) => page.isCurrent);
    const previous = props.pages.previous;
    const pageSize = 5;

    console.log(around);

    return (
        <Pagination>
            {first && <PaginationButtonWrapper fetchMore={props.fetchMore} button={Pagination.First} first={pageSize} after={first.cursor} />}
            {previous && <PaginationButtonWrapper fetchMore={props.fetchMore} button={Pagination.Prev} first={pageSize} after={previous.cursor} />}
            {
                around && around.map((page, i) => (
                    <PaginationButtonWrapper fetchMore={props.fetchMore} active={page.isCurrent} key={i} button={Pagination.Item} first={pageSize} after={page.cursor}>
                        {page.pageNumber}
                    </PaginationButtonWrapper>
                ))
            }
            {!last.isCurrent && current && <PaginationButtonWrapper fetchMore={props.fetchMore} button={Pagination.Next} first={pageSize} after={current.cursor} />}
            {last && <PaginationButtonWrapper fetchMore={props.fetchMore} button={Pagination.Last} first={pageSize} after={last.cursor} />}
        </Pagination>
    )

}