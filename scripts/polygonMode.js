(function (global) {
  function createPolygonModeModule() {
    function activate() {
      console.log("Полігони");
    }

    return {
      activate
    };
  }

  global.createPolygonModeModule = createPolygonModeModule;
})(window);
