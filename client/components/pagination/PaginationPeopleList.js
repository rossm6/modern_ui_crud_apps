import React, { useState } from 'react';
import { gql, useQuery } from "@apollo/client";
import PaginationPerson from './PaginationPerson';
import Pagination from './Pagination';

// page size is fixed at 5 to begin with

export const LOAD_PEOPLE  = gql`
  query LoadPeople ($first: Int, $after: String) {
    viewer {
      id
      peoplePages (first: $first, after: $after) {
        edges {
          node {
            firstName
            lastName
            age
            sex
            alive
            uniqueIdentifier
            pk
            id
            randomNumber
          }
          cursor
        }
        pages (pageSize: 5) {
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
      }
    }
  }
`;

export default (props) => {
    const {
        loading,
        data,
        fetchMore
    } = useQuery(LOAD_PEOPLE, {
        variables: {
            first: 5,
            after: ''
        }
    });

    if (loading) return <div>Loading</div>;

    return (
        <>
            <table className="table">
                <thead>
                    <tr>
                        <th>Unique Identifier</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Random Number</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        data?.viewer.peoplePages.edges.map((edge, key) => (
                            <tr key={key}>
                                <PaginationPerson person={edge.node}/>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <div className="py-5">
                <Pagination fetchMore={fetchMore} pages={data?.viewer.peoplePages.pages}/>
            </div>
        </>
    )
};