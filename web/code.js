(function($, window, document) {

  var SLIDER_PREC_DIGITS = 2;
  var SLIDER_SCALING = Math.pow(10, SLIDER_PREC_DIGITS);
  var CUTOFF_MIN = 0.53;
  var CUTOFF_MAX = 1.0;
  var CUTOFF_DEFAULT = 0.85;

  function initGraph(data, textStatus, jqXHR) {

    var elements = data.elements;

    cy = cytoscape({
      textureOnViewport: true,
      pixelRatio: 1,
      motionBlur: false,

      container: document.getElementById('cy'),

      /*
        green = RGBColor[127/255, 209/255, 59/255],
        orange = RGBColor[254/255, 184/255, 10/255]
      */

      style: cytoscape.stylesheet()
        .selector('node')
          .css({
            'content': 'data(name)',
            'font-size': 20,
            'width': 30,
            'height': 30,
          })
        .selector('node[?is_sh2][!is_ppb]')
          .css({
            'background-color': 'rgb(234, 21, 122)', // red
          })
        .selector('node[!is_sh2][?is_ppb]')
          .css({
            'background-color': 'rgb(0, 126, 234)', // blue
          })
        .selector('node[?is_sh2][?is_ppb]')
          .css({
            'background-color': 'rgb(117, 74, 178)', // purple (blend of red and blue)
          })
        .selector('edge')
          .css({
            'opacity': 0.5,
            'width': 3,
            'line-color': '#808080',
            'curve-style': 'bezier',
            'haystack-radius': 1,
            'mid-target-arrow-color': '#808080',
            'mid-target-arrow-shape': 'triangle',
          })
        .selector('edge:selected')
          .css({
            'content': 'data(probability_rounded)',
            'font-size': 20,
            'font-style': 'italic',
          })
        .selector(':selected')
         .css({
           'border-color': 'black',
           'border-style': 'double',
           'border-width': 10,
           'opacity': 1
         }),

      layout: {
        name: 'preset',
      },

      elements: elements,

    });

    // Set probability data value on nodes to max of probability on incident
    // edges. Then hide/show logic can hide "orphan" nodes trivially.
    cy.nodes().each(function(i, ele) {
      var edges = ele.neighborhood('edge');
      var pmax = edges.max(function(ele) { return ele.data('probability'); });
      ele.data('probability', pmax.value);
    });
    // Add a property with the probability rounded to 3 places for display.
    cy.edges().each(function(i, ele) {
      ele.data('probability_rounded', ele.data('probability').toFixed(3));
    });

    // Calling setCutoff requires that cy is initialized, but this is not a
    // very good place to put this code as it's not related to building the
    // graph.
    setCutoff($slider.slider("value") / SLIDER_SCALING);

    // DEBUG
    window.cy = cy;

  }

  // Slide event handler for cutoff slider. Note that the ui.value is scaled!
  function cutoffSlide(event, ui) {
    var cutoff = ui.value / SLIDER_SCALING;
    setCutoff(cutoff);
  }

  // Update UI with new cutoff value. cutoff is actual value - unscaled.
  function setCutoff(cutoff) {
    var old_cutoff = $("#cutoff").val();
    // Convert from the string value the form field gives us into a float.
    if (old_cutoff == "") {
      // If the field was empty, this is the first time we've been called.
      // Pretend we're sliding up from 0 (the lowest possible probability value)
      // so all of the lower-probability nodes will get hidden.
      old_cutoff = 0;
    } else {
      old_cutoff = parseFloat(old_cutoff);
    }
    // Use .toFixed so that e.g. 0.9 becomes "0.90".
    var cutoff_fmt = cutoff.toFixed(SLIDER_PREC_DIGITS);
    // Set form field which displays the value to the user.
    $("#cutoff").val(cutoff_fmt);
    if (cutoff < old_cutoff) {
      // Cutoff decreased -- reveal some nodes.
      var sel = '[probability>=' + cutoff + '][probability<' + old_cutoff + ']';
      cy.elements().filter(sel).show();
    } else {
      // Cutoff increased -- hide some nodes.
      var sel = '[probability>=' + old_cutoff + '][probability<' + cutoff + ']';
      cy.elements().filter(sel).hide();
    }
  }

  $("document").ready(function() {

    // Get exported json from cytoscape desktop via ajax.
    $.get('../data/wt_53.cyjs', initGraph, 'json');

    // Set up slider for probability cutoff. Values are scaled because we need
    // floats but slider only provides ints.
    $slider = $("#slider");
    $slider.slider({
      value: CUTOFF_DEFAULT * SLIDER_SCALING,
      min: CUTOFF_MIN * SLIDER_SCALING,
      max: CUTOFF_MAX * SLIDER_SCALING,
      slide: cutoffSlide,
    });

  });


}(jQuery, window, document));
