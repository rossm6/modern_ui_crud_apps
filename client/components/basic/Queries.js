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