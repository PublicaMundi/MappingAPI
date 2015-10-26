(function (window, PublicaMundi) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi');

    PublicaMundi.Helpers = PublicaMundi.Class({
        initialize: function (options) {
        },
        
      });

   // PublicaMundi.helpers = function () {
  //      return PublicaMundi.locator.create('PublicaMundi.Helpers');
  //  };

    PublicaMundi.locator.register('PublicaMundi.Helpers', PublicaMundi.Helpers);
})(window, PublicaMundi);
