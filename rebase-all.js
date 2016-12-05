const { Repository, Branch, AnnotatedCommit, Reference, Rebase, Signature } = require('nodegit');

const MASTER = 'master';

Repository
  .open('./')
  .then(getReferences)
  .then(getAnnotatedCommitsFromReferences)
  .then(doRebases)
  .then(finishRebases)
  .then(handleSuccess)
  .catch(handleError);


function getReferences(repository) {
  return repository.getReferences(Reference.TYPE.LISTALL)
    .then(references => ({ repository, references }));
}

function getAnnotatedCommitsFromReferences({repository, references}) {
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
}

function doRebases({repository, masterAnnotatedCommit, branchesAnnotatedCommit}) {
  let initRebases = branchesAnnotatedCommit.map(branchAnnotatedCommit => {
    return Rebase.init(
      repository, 
      branchAnnotatedCommit, 
      masterAnnotatedCommit, 
      masterAnnotatedCommit
    );
  })
  let createSignature = Signature.default(repository);
  return Promise.all([createSignature, ...initRebases]);
}

function finishRebases([signature, ...rebases]) {
  rebases.map(rebase => {
    rebase.finish(signature);
  });
}

function handleSuccess() {
  console.log('Rebase completed!');
}

function handleError(error) {
  throw new Error(`Rebase failed: ${error}`);
}
