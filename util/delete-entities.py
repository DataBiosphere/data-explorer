"""Delete all entities in a workspace.

This is useful when working on Export to Saturn feature.

To run:

virtualenv ~/virtualenv/firecloud
source ~/virtualenv/firecloud/bin/activate
pip install firecloud
python util/delete-entities.py WORKSPACE_NAMESPACE WORKSPACE_NAME
"""

import argparse
import collections
import sys

from firecloud import fiss


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace-namespace', required=True)
    parser.add_argument('--workspace-name', required=True)
    return parser.parse_args()


def main():
    args = parse_args()

    FissArgs = collections.namedtuple('FissArgs', ['project', 'workspace'])
    fiss_args = FissArgs(args.workspace_namespace, args.workspace_name)
    entities = fiss.entity_list(fiss_args)

    FissArgs = collections.namedtuple(
        'FissArgs', ['yes', 'project', 'workspace', 'entity_type', 'entity'])
    # entities are sorted by type: participant, participant_set, sample,
    # sample_set. FireCloud complains if we delete a participant before deleting
    # associated participant_set/sample/sample_set. By reversing the list, we
    # won't have this problem. We will delete: sample_set, sample,
    # participant_set, participant.
    for entity in reversed(entities):
        print('Deleting ' + entity)
        entity_splits = entity.split('\t')
        fiss_args = FissArgs(True, args.workspace_namespace,
                             args.workspace_name, entity_splits[0],
                             entity_splits[1])
        fiss.entity_delete(fiss_args)


if __name__ == '__main__':
    main()
