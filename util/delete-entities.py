"""Delete all entities in a workspace.

This is useful when working on Export to Saturn feature.

To run:
- virtualenv ~/virtualenv/firecloud
- source ~/virtualenv/firecloud/bin/activate
- pip install firecloud
- python util/delete-entities.py WORKSPACE_NAMESPACE WORKSPACE_NAME
"""

import sys

from firecloud import fiss


def main():
    if len(sys.argv) != 3:
        raise ValueError(
            'Usage: python util/delete-entities.py WORKSPACE_NAMESPACE WORKSPACE_NAME'
        )

    workspace_namespace = sys.argv[1]
    workspace_name = sys.argv[2]

    args = type('obj', (object, ), {
        'project': workspace_namespace,
        'workspace': workspace_name
    })
    entities = fiss.entity_list(args)

    # entities are sorted by type: participant, participant_set, sample,
    # sample_set. FireCloud complains if we delete a participant before deleting
    # associated participant_set/sample/sample_set. By reversing the list, we
    # won't have this problem. We will delete: sample_set, sample,
    # participant_set, participant.
    for entity in reversed(entities):
        print('Deleting ' + entity)
        args = type(
            'obj', (object, ), {
                'yes': True,
                'project': workspace_namespace,
                'workspace': workspace_name,
                'entity_type': entity.split('\t')[0],
                'entity': entity.split('\t')[1],
            })
        fiss.entity_delete(args)


if __name__ == '__main__':
    main()
