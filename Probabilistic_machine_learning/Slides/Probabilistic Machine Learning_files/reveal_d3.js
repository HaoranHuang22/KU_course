handleEvent = function(isSlideEvent) {
    
    var currentSlideId = Reveal.getCurrentSlide().id;
    var currentFragment = Reveal.getIndices().f;
    
    // Don't go any further if the slide has no ID (i.e. the string is empty).
    if (!currentSlideId) {
        return;
    }
    
    // If there is no entry corresponding to the current slide in the map, don't go further.
    var functions = slideIdToFunctions[currentSlideId];
    if (functions == null) {
        return;
    }
    
    // Call the init function when arriving on a slide for the first time.
    if (isSlideEvent) {
        var initFunction = functions.init;
        if (initFunction != null) {
            var obj = initFunction();
            // Make sure we don't call the init function again.
            functions.init = null;
            functions.obj = obj 
        }
    }
    
    var fragmentFunction = functions[currentFragment];
    if (fragmentFunction != null) {
        fragmentFunction(functions.obj);
    }    
};

handleSlideEvent = function() {
    handleEvent(true);
};

handleFragmentEvent = function() {
    handleEvent(false);
};

Reveal.addEventListener('slidechanged', handleSlideEvent);

Reveal.addEventListener('fragmentshown', handleFragmentEvent);

Reveal.addEventListener('fragmenthidden', handleFragmentEvent);

