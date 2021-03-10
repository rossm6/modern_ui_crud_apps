import React from 'react';

export default (props) => {

    return (
        <>
            <td>{props.person.uniqueIdentifier}</td>
            <td>{props.person.firstName}</td>
            <td>{props.person.lastName}</td>
            <td>{props.person.randomNumber}</td>
        </>
    )
};