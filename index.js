var request = require('request');
var fs = require('fs');
var xml2js = require('xml2js');
var fetch = require('node-fetch');
var _ = require('lodash');

fetch.Promise = require('bluebird'); 
 
var parser = new xml2js.Parser({emptyTag: '', newline: '\n'});

var result = [];

function NUhelpVendorTransformer(vendor) {
    var obj = {};
    var categoryObj = this;

    // quick check on vendor.name to eliminate empty entities
    if(! vendor.name[0]) return;

    obj.id = vendor.name[0];
    obj.title = vendor.title[0];
    obj.category = [categoryObj.title[0]];
    obj.description = vendor.description[0];
    obj.website = vendor.website[0];
    obj.email = vendor.email[0];
    obj.discount = vendor.discount[0];
    obj.available = vendor.available[0] ? vendor.available[0].value : [];
    obj.addresses = _.map(vendor.addr, function (address) {
        return {
            addrStreet: address.street[0],
            addrCity: address.city[0],
            addrZip: address.zip[0],
            phone: address.phone[0],
            lat: address.latitude[0],
            lng: address.longitude[0]
        };
    });
    var test = _.findWhere(result, {id: obj.id});
    if (test) {
        test.category.push(obj.category[0]);
        return;
    }
    result.push(obj);
}

//fetch('http://www.northwestern.edu/uservices/wildcard/advantage_discounts/category/all_mweb.xml')
fetch('http://www.northwestern.edu/wildcard/discounts/category/all_mweb.xml')
    .then(function (res) {
        return res.text();
    }).then(function (xml) {
        fs.writeFile('./raw-source/all_mweb.xml', xml);
        return xml;
    }).then(function (xml) {
        parser.parseString(xml, function (err, parsed) {
            _.each(parsed.wildcard.category, function (category) {
                var categoryTitle = category.title;
                _.each(category.vendors[0].vendor, NUhelpVendorTransformer.bind(category));
            });
            
            fs.writeFile('./parsed/advantage.json', JSON.stringify(result, null, 2), function (err) {
                if (err) console.log(err);
            });
            fs.writeFile('./parsed/parsed-raw.json', JSON.stringify(parsed, null, 2), function (err) {
                if (err) console.log(err);
            });
        });
    });
