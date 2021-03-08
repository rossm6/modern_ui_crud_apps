import React, { useState } from 'react';
import { gql, useMutation, useQuery } from "@apollo/client";
import Button from 'react-bootstrap/Button';
import utils from '../../utils';
import { ALL_PEOPLE } from '../basic/Queries';

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
        update(cache, o) {
            // CACHE.WRITEQUERY WILL TRIGGER THE MERGE FUNCTION
            // WHICH IS CONTAINAED WITHIN THE TYPE POLICY OBJECT
            // FOR FIELD `PEOPLE`
            // CACHE.MODIFY DOES NOT DO THIS
            const current = cache.readQuery({ query: ALL_PEOPLE });
            console.log("current");
            console.log(current);
            const deleted_id = o.data.deletePerson.deletedPersonId;
            cache.modify({
                id: cache.identify(current.viewer),
                fields: {
                    people(cachedPeople, o) {
                        // cachedPeople contains edges where the node
                        // is a ref
                        const pageInfo = { ...cachedPeople.pageInfo };
                        const edges = cachedPeople.edges.filter(function (e, i) {
                            return deleted_id !== o.readField('id', e.node)
                        });
                        pageInfo.startCursor = "";
                        pageInfo.endCursor = "";
                        if (edges.length) {
                            pageInfo.startCursor = edges[0].cursor;
                            pageInfo.endCursor = edges[edges.length - 1].cursor;
                        }
                        return {
                            ...cachedPeople,
                            edges,
                            pageInfo,
                        }
                    },
                },
            });
            // cache.writeQuery({
            //     query: ALL_PEOPLE,
            //     data: {
            //         viewer: {
            //             people: {
            //                 pageInfo: {
            //                     ...current.viewer.people.pageInfo
            //                 },
            //                 edges: current.viewer.people.edges.filter(function(e, i){
            //                     return e.node.id !== o.data.deletePerson.deletedPersonId;
            //                 })
            //             }
            //         }
            //     }
            // });
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
                <Button variant="danger" onClick={() => { deletePerson({ variables: { input: { id: props.person.id } } }) }}>Delete</Button>
            </td>
        </>
    )
};