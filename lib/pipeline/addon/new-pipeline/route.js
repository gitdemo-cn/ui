import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { hash } from 'rsvp';

let precanStages = ()=> [{
      name: 'clone',
      steps: []
    },{
      name: 'build',
      steps: []
    },{
      name: 'publish',
      steps: [{
        type:"build",
        "publishImageConfig": {
            "dockerfilePath": "./Dockerfile",
            "buildContext": ".",
            "tag": "pipeline/build:dev"
          }
      }]
    }];
export default Route.extend({
  globalStore: service(),
  projectStore: service('store'),
  precanStages: precanStages(),
  model: function() {
    var globalStore = this.get('globalStore');
    var projectStore = this.get('projectStore');
    let projectModel = window.l('route:application').modelFor('authenticated.project');
    let projectId = projectModel.project.id;
    let clusterId = projectModel.project.clusterId;
    let accounts = globalStore.findAll('sourceCodeCredential');
    let clusterPipeline = globalStore.find('clusterPipeline', `${clusterId}:${clusterId}`, {forceReload: true});
    let projectDockerCredentials = projectStore.all('dockerCredential');
    return hash({accounts, clusterPipeline, projectDockerCredentials} ).then(({accounts, clusterPipeline, projectDockerCredentials})=>{
      let pipeline = globalStore.createRecord({type:'pipeline', projectId , stages: this.get('precanStages')});
      if(!accounts.content.length){
        return {
          pipeline,
          accounts,
          clusterPipeline,
          projectDockerCredentials,
          repositories: [],
          language: 'custom'
        };
      }else{
        return accounts.content[0].followLink('sourceCodeRepositories').then(res=>{
          return {
            pipeline,
            accounts,
            clusterPipeline,
            projectDockerCredentials,
            repositories: res,
            language: 'custom'
          }
        })
      }
    })
  },
  resetController(controller){
    controller.set('errors', '');
    controller.set('saved', false);
    this.set('precanStages',precanStages())
  },
});