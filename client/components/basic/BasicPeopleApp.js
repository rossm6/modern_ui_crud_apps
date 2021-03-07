import React, { useState } from 'react';
import { gql, useMutation, useQuery } from "@apollo/client";
import BasicPeopleList from './BasicPeopleList';
import Button from 'react-bootstrap/Button';
import utils from '../../utils';
import { ALL_PEOPLE } from './Queries';

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

    // we don't care about updating the cursor here because
    // any new item is just added to the bottom of the list
    // and we aren't implementing pagination of any kind
    const [createPerson] = useMutation(CREATE_PERSON, {
        update(cache, o){
            const current = cache.readQuery({query: ALL_PEOPLE});
            const data = {
                viewer: {
                    people: {
                        edges: [
                            ...current.viewer.people.edges,
                            o.data.createPerson
                        ]
                    }
                }
            };
            cache.writeQuery({
                query: ALL_PEOPLE,
                data,
            });
        },
    });

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
            <BasicPeopleList/>
        </div>
    );
};