import React, { useState } from 'react';
import { gql, useMutation, useQuery } from "@apollo/client";
import BasicPerson from '../basic/BasicPerson';
import { LOAD_PEOPLE } from '../basic/Queries';
import Button from 'react-bootstrap/Button';

// TODO
// this fragment needs defining in the server side schema first
// then can be used in client side queries
const PERSON_FRAGMENT = gql`
  fragment Person on PersonNode {
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
`;

const UPDATE_PERSON = gql`
  mutation UpdatePerson($input: UpdatePersonMutationInput!){
    updatePerson(input: $input){
      person {
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
      errors {
        field
        messages
      }
    }
  }
`;

export default (props) => {
    const [name, setName] = useState('');
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

    const [updatePerson] = useMutation(UPDATE_PERSON);

    const loadMore = () => {
        if(data?.viewer.people.pageInfo.hasNextPage){
            const endCursor = data.viewer.people.pageInfo.endCursor;
            fetchMore({
                variables: {
                    first: 5,
                    after: endCursor
                }
            });
        }
    }

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
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        data?.viewer.people.edges.map((edge, key) => (
                            <tr key={key}>
                                <BasicPerson person={edge.node} updater={updatePerson} />
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <div className="py-5">
                <Button variant="info" onClick={loadMore}>Load More</Button>
            </div>
        </>
    )
};