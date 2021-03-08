import React, { useState } from 'react';
import { gql, useMutation, useQuery } from "@apollo/client";
import Button from 'react-bootstrap/Button';
import utils from '../../utils';
import LoadMorePeopleList from './LoadMorePeopleList';
import { ALL_PEOPLE } from '../basic/Queries';

const CREATE_PERSON = gql`
  mutation CreatePerson($input: CreatePersonMutationInput!){
    createPerson(input: $input){
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
    }
  }
`;

export default (props) => {

    // It doesn't make sense to append the new item to the UI
    // with a load more button ...
    // well, unless everything from the server is already downloaded I suppose.
    // we won't worry about that here
    const [createPerson] = useMutation(CREATE_PERSON);

    const createRandomer = () => {
        createPerson({
            variables: {
                input: {
                    firstName: "Adrian",
                    lastName: "Smith",
                    age: 26,
                    sex: "m",
                    alive: true,
                    uniqueIdentifier: utils.random_number(),
                    randomNumber: utils.random_number()
                }
            }
        });
    };

    return (
        <div>
            <div className="my-3">
                <Button variant="success" onClick={createRandomer}>Create</Button>
            </div>
            <LoadMorePeopleList />
        </div>
    );
};