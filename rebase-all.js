const { Repository, Branch, AnnotatedCommit, Reference, Rebase } = require('nodegit');

const MASTER = 'master';

Repository
  .open('./')
  .then(repository => repository.getReferences(Reference.TYPE.LISTALL).then(references => { 
    return { repository, references };
  }))
  .then(processReferences)
  .then(({repository, masterAnnotatedCommit, branchesAnnotatedCommit}) => {
    let doRebases = branchesAnnotatedCommit.map(branchAnnotatedCommit => {
      return Rebase.init(repository, branchAnnotatedCommit, masterAnnotatedCommit);
    })
    return Promise.all(doRebases);
  })
  .then(rebases => {
    console.log('end');
    console.log(rebases)
  });

  function processReferences({repository, references}) {
    let masterReference = references.find(reference => reference.shorthand() === MASTER);
    let branchesReference = references.filter(reference => reference.shorthand !== MASTER)

     

    let createMasterAnnotatedCommit = AnnotatedCommit.fromRef(repository, masterReference);

    

    let createBranchesAnnotatedCommit = branchesReference.map(reference => (
        AnnotatedCommit.fromRef(repository, reference)
      )
    );

    return Promise.all([createMasterAnnotatedCommit, ...createBranchesAnnotatedCommit])
      .then(annotatedCommits => {
        return { 
          repository, 
          masterAnnotatedCommit: annotatedCommits[0],
          branchesAnnotatedCommit: annotatedCommits.slice(1)
        };
    });
  };

