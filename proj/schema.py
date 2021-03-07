import graphene
import people.schema

class Query(
    people.schema.Query,
    graphene.ObjectType
):
    pass

class Mutation(
    people.schema.Mutation,
    graphene.ObjectType
):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)

"""
python3 manage.py graphql_schema --schema proj.schema.schema --out schema.json
"""