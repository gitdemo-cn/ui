import { resolve } from 'rsvp';
import { alias } from '@ember/object/computed';
import Mixin from '@ember/object/mixin';
import Resource from 'ember-api-store/models/resource';
import Errors from 'ui/utils/errors';
import { get, set } from '@ember/object';

export default Mixin.create({
  originalModel: null,
  errors: null,
  editing: true,
  primaryResource: alias('model'),
  originalPrimaryResource: alias('originalModel'),

  tagName: 'form', // This indirectly disables global navigation shortcut keys

  init: function() {
    this._super();
    set(this, 'errors',null);
  },

  validate: function() {
    var model = get(this, 'primaryResource');
    var errors = model.validationErrors();
    if ( errors.get('length') )
    {
      set(this, 'errors', errors);
      return false;
    }

    set(this, 'errors', null);
    return true;
  },

  submit(event) {
    event.preventDefault();
    this.send('save');
  },

  actions: {
    error: function(err) {
      if (err)
      {
        var body = Errors.stringify(err);
        set(this, 'errors', [body]);
      }
      else
      {
        set(this, 'errors', null);
      }
    },

    save: function(cb) {
      // Will save can return true/false or a promise
      resolve(this.willSave()).then((ok) => {
        if ( !ok )
        {
          // Validation or something else said not to save
          if ( cb )
          {
            cb();
          }
          return;
        }

        this.doSave()
        .then(this.didSave.bind(this))
        .then(this.doneSaving.bind(this))
        .catch((err) => {
          this.send('error', err);
          this.errorSaving(err);
        }).finally(() => {
          try {
            if ( cb )
            {
              cb();
            }
          }
          catch(e) {
          }
        });
      });
    }
  },

  // willSave happens before save and can stop the save from happening
  willSave: function() {
    set(this, 'errors',null);
    var ok = this.validate();
    return ok;
  },

  doSave: function(opt) {
    return get(this, 'primaryResource').save(opt).then((newData) => {
      return this.mergeResult(newData);
    });
  },

  mergeResult: function(newData) {
    var original = get(this, 'originalPrimaryResource');
    if ( original )
    {
      if ( Resource.detectInstance(original) )
      {
        original.merge(newData);
        return original;
      }
    }

    return newData;
  },

  // didSave can be used to do additional saving of dependent resources
  didSave: function(neu) {
    return neu;
  },

  // doneSaving happens after didSave
  doneSaving: function(neu) {
    return neu || get(this, 'originalPrimaryResource') || get(this, 'primaryResource');
  },

  // errorSaving can be used to do additional cleanup of dependent resources on failure
  errorSaving: function(/*err*/) {
  },
});