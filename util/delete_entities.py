"""Delete all entities in a workspace.

This is useful when working on Export to Saturn feature.

To run:

virtualenv ~/virtualenv/firecloud
source ~/virtualenv/firecloud/bin/activate
pip install firecloud
python util/delete_entities.py WORKSPACE_NAMESPACE WORKSPACE_NAME
"""
import argparse
import collections
import sys

import firecloud.api as fapi

FC_ENTITY_TYPES = [
    'participant', 'sample', 'participant_set', 'sample_set', 'pair'
]


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('workspace_namespace')
    parser.add_argument('workspace_name')
    return parser.parse_args()


def delete_entities(entity_type, entities):
    fapi.delete_entity_type(args.workspace_namespace, args.workspace_name,
                            entity_type, entities)
    fapi._check_response_code(resp, 200)
    print 'Succesfully deleted entities of type: %s' % entity_type


def main():
    args = parse_args()

    resp = fapi.get_entities_with_type(args.workspace_namespace,
                                       args.workspace_name)
    fapi._check_response_code(resp, 200)

    entities_by_type = {}
    for entity in resp.json():
        entity_type = entity['entityType']
        if entity_type not in entities_by_type:
            entities_by_type[entity_type] = []
        entities_by_type[entity_type].append(entity['name'])

    # Entities are sorted by type: participant, participant_set, sample,
    # sample_set. FireCloud complains if we delete a participant before deleting
    # associated participant_set/sample/sample_set.
    for entity_type in FC_ENTITY_TYPES:
        if entity_type in entities_by_type:
            entities = entities_by_type[entity_type]
            delete_entities(entity_type, entities)
            del entities_by_type[entity_type]

    # Delete the remaining entities where order does not matter.
    for entity_type, entities in entities_by_type.iteritems():
        if entity_type not in FC_ENTITY_TYPES:
            fapi.delete_entity_type(args.workspace_namespace,
                                    args.workspace_name, entity_type, entities)
            fapi._check_response_code(resp, 200)
            print 'Succesfully deleted entities of type: %s' % entity_type


if __name__ == '__main__':
    main()
