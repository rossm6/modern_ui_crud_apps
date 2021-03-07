import React, { useState } from 'react';
import { gql, useMutation, useQuery } from "@apollo/client";
import BasicPerson from './BasicPerson';
import { ALL_PEOPLE } from './Queries';

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
    } = useQuery(ALL_PEOPLE);

    const [updatePerson] = useMutation(UPDATE_PERSON);

    if (loading) return <div>Loading</div>;

    return (
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
    )
};