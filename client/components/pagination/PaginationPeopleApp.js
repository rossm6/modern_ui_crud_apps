import React, { useState } from 'react';
import { gql, useMutation, useQuery } from "@apollo/client";
import LoadMorePeopleList from './LoadMorePeopleList';
import { ALL_PEOPLE } from '../basic/Queries';

export default (props) => {

    return (
        <div>
            <PaginationPeopleList />
        </div>
    );
};