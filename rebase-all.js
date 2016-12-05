const { Repository, Branch, AnnotatedCommit, Reference, Rebase, Signature } = require('nodegit');

const MASTER = 'master';

Repository
  .open('./')
  .then(repository => repository.getReferences(Reference.TYPE.LISTALL).then(references => { 
    return { repository, references };
  }))
  .then(processReferences)
  .then(({repository, masterAnnotatedCommit, branchesAnnotatedCommit}) => {
    let doRebases = branchesAnnotatedCommit.map(branchAnnotatedCommit => {
      return Rebase.init(
        repository, 
        branchAnnotatedCommit, 
        masterAnnotatedCommit, 
        masterAnnotatedCommit
      );
    })
    let createSignature = Signature.default(repository);
    return Promise.all([createSignature, ...doRebases]);
  })
  .then(([signature, ...rebases]) => {
    console.log(signature);
    rebases.map(rebase => {
      rebase.finish(signature);
    });
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

