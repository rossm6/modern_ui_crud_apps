import React, { useState } from 'react';
import { gql, useMutation, useQuery } from "@apollo/client";
import Button from 'react-bootstrap/Button';
import utils from '../../utils';
import { ALL_PEOPLE } from './Queries';

const DELETE_PERSON = gql`
  mutation DeletePerson($input: DeletePersonMutationInput!){
      deletePerson(input: $input){
        deletedPersonId
      }
  }
`;

export default (props) => {

    const update = (person) => {
        const r = utils.random_number();
        const person_cp = Object.assign({}, person);
        person_cp.id = person_cp.pk;
        delete person_cp["pk"];
        delete person_cp["__typename"];
        console.log("person input", person_cp);
        props.updater({
            variables: {
                input: {
                    ...person_cp,
                    randomNumber: r
                }
            }
        });
    };

    const [deletePerson] = useMutation(DELETE_PERSON, {
        update(cache, o){
            const current = cache.readQuery({query: ALL_PEOPLE});
            cache.writeQuery({
                query: ALL_PEOPLE,
                data: {
                    viewer: {
                        people: {
                            pageInfo: {
                                ...current.viewer.people.pageInfo
                            },
                            edges: current.viewer.people.edges.filter(function(e, i){
                                return e.node.id !== o.data.deletePerson.deletedPersonId;
                            })
                        }
                    }
                }
            });
        },
    });

    return (
        <>
            <td>{props.person.uniqueIdentifier}</td>
            <td>{props.person.firstName}</td>
            <td>{props.person.lastName}</td>
            <td>{props.person.randomNumber}</td>
            <td>
                <Button variant="primary" onClick={() => update(props.person)}>Edit</Button>
            </td>
            <td>
                <Button variant="danger" onClick={() => {deletePerson({ variables: {input: {id: props.person.id}} })}}>Delete</Button>
            </td>
        </>
    )
};