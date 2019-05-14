import _ from 'lodash';
import { toString } from '../helper';
import { ObjectID } from 'mongodb';
import { OrderedMap } from 'immutable';

export default class Channel{
  constructor(app) {
    this.app = app;

    this.channels = new OrderedMap();
  }

  load(id) {
    return new Promise ((resolve, reject) => {
      id = _.toString(id);
    
      // find in cache
      const channelFromCache = this.channels.get(id);

      if(channelFromCache) {
        return resolve(channelFromCache);
      }

      // find in db if not found
      this.findById(id).then((c) => {
        return c;
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  findById(id) {
    return new Promise((resolve, reject) => {
      this.app.db.collection('channels').findOne({_id: new ObjectID(id)}, (err, result) => {
        if(err || !result) {
          return reject(err ? err : 'Not Found');
        }
        return resolve(result);
      });
    })
  }

  create(obj) {
    return new Promise((resolve, reject) => {
      let id = toString(_.get(obj, '_id'));
      let idObject = id ? new ObjectID(id) : new ObjectID();

      let members = [];

      _.each(_.get(obj, 'members', []), (value, key) => {
        console.log('key', key, value);
        const memberObjectId = new ObjectID(key);
        members.push(memberObjectId);
      });

      let userIdObject = null;
      let userId = _.get(obj, 'userId', null);
      if(userId) {
        userIdObject = new ObjectID(userId);
      }

      const channel = {
        _id: idObject,
        title: _.get(obj, 'title', ''),
        lastMessage: _.get(obj, 'lastMessage', ''),
        created: new Date(),
        userId: userIdObject,
        members: members,
      }

      this.app.db.collection('channels').insertOne(channel, (err, info) => {
        if(!err) {
          const channelId = channel._id.toString();
          this.channels = this.channels.set(channelId, channel);
        }
        return err ? reject(err) : resolve(channel);
      });
    });
  }
}