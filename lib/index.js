'use strict';

/**
 * Module dependencies
 */

/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
// Public node modules.
const _ = require('lodash');
const AWS = require('aws-sdk');

module.exports = {
  provider: 'digitalocean',
  name: 'DigitalOcean Spaces',
  auth: {
    public: {
      label: 'Access API Token',
      type: 'text'
    },
    private: {
      label: 'Secret Access Token',
      type: 'text'
    },
    region: {
      label: 'Region',
      type: 'enum',
      values: [
        'nyc3'
      ]
    },
    bucket: {
      label: 'Bucket',
      type: 'text'
    }
  },
  init: (config,endpoint='nyc3.digitaloceanspaces.com',region='NYC3') => {

    const spacesEndpoint = new AWS.Endpoint(endpoint);

    // configure AWS DO bucket connection
    AWS.config.update({
      endpoint: spacesEndpoint,
      accessKeyId: config.public,
      secretAccessKey: config.private,
      region: region
    });


    const DO = new AWS.S3({
      apiVersion: 'latest',
      signatureVersion: 's3',
      params: {
        Bucket: config.bucket
      }
    });

    return {
      upload: async (file,acl='public-read',file_type='binary') => {
        return new Promise((resolve, reject) => {
          // upload file on DO bucket
          DO.upload({
            Key: `${file.hash}${file.ext}`,
            Body: new Buffer(file.buffer, file_type),
            ACL: acl
          }, (err, data) => {
            if (err) {
              return reject(err,data);
            }

            // set the bucket file url
            file.url = data.Location;

            resolve({ url: file.url, 'data': data });
          });
        });
      },
      delete: async (file) => {
        return new Promise((resolve, reject) => {
          // delete file on DO bucket
          DO.deleteObjects({
            Delete: {
              Objects: [{
                Key: `${file.hash}${file.ext}`
              }]
            }
          }, (err, data) => {
            if (err) {
              return reject(err);
            }

            resolve({'data': data});
          });
        });
      }
    };
  }
};
