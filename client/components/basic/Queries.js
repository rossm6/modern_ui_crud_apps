import { gql, useMutation, useQuery } from "@apollo/client";

export const ALL_PEOPLE = gql`
  query AllPeople {
    viewer {
      id
      people {
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
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
      }
    }
  }
`;

export const LOAD_PEOPLE  = gql`
  query LoadPeople ($first: Int, $after: String) {
    viewer {
      id
      people (first: $first, after: $after) {
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
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
      }
    }
  }
`;