// add button functionality to drawButtonEllipses() function

let debounceTimer;
let debounceTimerArray; 

// Track the currently loaded instrument sets and their buffers
let loadedInstrumentSetBuffers = {};
// clickable buttons for instruments
let buttonSize = 20; // Example size of the button
let ellipseButtons = [];
let ellipseColors = [
  [255,228,209],   // Red
  [203,237,209],   // Green
  [187,234,255]    // Blue
];

let buttonGraphics;

let gapIndex = 9; // Specify the index where the gap should be

let individualInstrumentArray = new Array(37).fill(1);

let startX, startY;

let circleCenterX, circleCenterY, circleRadius;
let points;
let numRings = 7;
let numSegments = 16;

let duration = 550; // (milliseconds)

// Audio functions
let audioBuffers = [];
let timeouts = [];
let isPlaying = false;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let bufferLoader;
let startTime;
let playButton;
let clearButton;
let durationSlider;

let timeoutIds = [];
let graphics; // Offscreen graphics buffer

// Loading audio files
// BufferLoader class to handle loading audio files
function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  let request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  let loader = this;

  request.onload = function() {
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          console.error('Error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length) {
          loader.onload(loader.bufferList);
        }
      },
      function(error) {
        console.error('decodeAudioData error for ' + url, error);
      }
    );
  };

  request.onerror = function() {
    console.error('BufferLoader: XHR error for ' + url);
  };

  request.send();
};

BufferLoader.prototype.load = function() {
  for (let i = 0; i < this.urlList.length; ++i) {
    this.loadBuffer(this.urlList[i], i);
  }
};

function preload() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  loadAudioSet(individualInstrumentArray);
}

// Function to load audio set based on individualInstrumentArray
function loadAudioSet(individualInstrumentArray) {
  let filePathsToLoad = [];
  let bufferIndicesToLoad = [];

  for (let i = 0; i < 37; i++) {
    let setNumber = individualInstrumentArray[i];
    let instrumentSet = '';

    if (setNumber === 1) {
      instrumentSet = 'comb';
    } else if (setNumber === 2) {
      instrumentSet = 'piano';
    } else if (setNumber === 3) {
      instrumentSet = 'guitar';
    } else {
      console.error(`Invalid set number ${setNumber} at index ${i}`);
      return;
    }

    let filePath = `${instrumentSet}/${i}.mp3`;
    filePathsToLoad.push(filePath);
    bufferIndicesToLoad.push(i);
  }

  if (filePathsToLoad.length > 0) {
    bufferLoader = new BufferLoader(
      audioContext,
      filePathsToLoad,
      (newBufferList) => finishedLoading(newBufferList, bufferIndicesToLoad)
    );
    bufferLoader.load();
  } else {
    // If no files need to be loaded, call finishedLoading with an empty array
    finishedLoading([], []);
  }
}

function finishedLoading(newBufferList, bufferIndicesToLoad) {
  for (let i = 0; i < newBufferList.length; i++) {
    let bufferIndex = bufferIndicesToLoad[i];
    audioBuffers[bufferIndex] = newBufferList[i];

    let setNumber = individualInstrumentArray[bufferIndex];
    let instrumentSet = '';
    if (setNumber === 1) {
      instrumentSet = 'comb';
    } else if (setNumber === 2) {
      instrumentSet = 'piano';
    } else if (setNumber === 3) {
      instrumentSet = 'guitar';
    }

    let filePath = `${instrumentSet}/${bufferIndex}.mp3`;
    loadedInstrumentSetBuffers[filePath] = newBufferList[i];
  }

  // Remove entries from loadedInstrumentSetBuffers that were not loaded in this batch
  if (newBufferList.length > 0) {
    let filePathsLoaded = newBufferList.map((buffer, index) => {
      let bufferIndex = bufferIndicesToLoad[index];
      let setNumber = individualInstrumentArray[bufferIndex];
      let instrumentSet = '';
      if (setNumber === 1) {
        instrumentSet = 'comb';
      } else if (setNumber === 2) {
        instrumentSet = 'piano';
      } else if (setNumber === 3) {
        instrumentSet = 'guitar';
      }
      return `${instrumentSet}/${bufferIndex}.mp3`;
    });

    for (let filePath in loadedInstrumentSetBuffers) {
      if (!filePathsLoaded.includes(filePath)) {
        delete loadedInstrumentSetBuffers[filePath];
      }
    }
  }
}

let majorPentatonic = {
  0: 0,
  1: 2,
  2: 4,
  3: 7,
  4: 9,
  5: 12,
  6: 14,
  7: 16,
  8: 19,
  9: 21,
  10: 24,
  11: 26,
  12: 28,
  13: 31,
  14: 33,
  15: 36
}

let minorPentatonic = {
  0: 0,
  1: 3,
  2: 5,
  3: 7,
  4: 10,
  5: 12,
  6: 15,
  7: 17,
  8: 19,
  9: 22,
  10: 24,
  11: 27,
  12: 29,
  13: 31,
  14: 34,
  15: 36
}

let ionian = {
  0: 0,
  1: 2,
  2: 4,
  3: 5,
  4: 7,
  5: 9,
  6: 11,
  7: 12,
  8: 14,
  9: 16,
  10: 17,
  11: 19,
  12: 21,
  13: 23,
  14: 24,
  15: 26
}

let dorian = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 9,
  6: 10,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 21,
  13: 22,
  14: 24,
  15: 26
}

let mixolydian = {
  0: 0,
  1: 2,
  2: 4,
  3: 5,
  4: 7,
  5: 9,
  6: 10,
  7: 12,
  8: 14,
  9: 16,
  10: 17,
  11: 19,
  12: 21,
  13: 22,
  14: 24,
  15: 26
}

let aeolian = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 8,
  6: 10,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 20,
  13: 22,
  14: 24,
  15: 26
}

let chromatic = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15
}

let harmonicMinor = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 8,
  6: 11,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 20,
  13: 23,
  14: 24,
  15: 26
}

let wholeTone = {
  0: 0,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16,
  9: 18,
  10: 20,
  11: 22,
  12: 24,
  13: 26,
  14: 28,
  15: 30
}

let octatonic = {
  0: 0,
  1: 1,
  2: 3,
  3: 4,
  4: 6,
  5: 7,
  6: 9,
  7: 10,
  8: 12,
  9: 13,
  10: 15,
  11: 16,
  12: 18,
  13: 19,
  14: 21,
  15: 22
}

// initial scale mapping (ie the default)
let scaleMappings = majorPentatonic;

function setup() {
  createCanvas(windowWidth, windowHeight);
  window.addEventListener('resize', resizeCanvasToWindow);
  frameRate(60);
  
  buttonGraphics = createGraphics(windowWidth, windowHeight);

  circleCenterX = windowWidth / 2;
  circleCenterY = windowHeight / 2;

  let baseRadius = Math.min(windowWidth, windowHeight) * 0.45;
  circleRadius = baseRadius;

  initializePointsArray();
  createPlayButton();
  createClearButton();
  
  // Scale dropdown
  scalesDropdown = createSelect();
  
  // Add options
  scalesDropdown.option('Select a Scale:', ''); // This will be the heading

  scalesDropdown.option('--- Pentatonic ---', 'disabled');
  scalesDropdown.option('Major');
  scalesDropdown.option('Minor');

  scalesDropdown.option('--- Modal ---', 'disabled');
  scalesDropdown.option('Ionian');
  scalesDropdown.option('Dorian');
  scalesDropdown.option('Mixolydian');
  scalesDropdown.option('Aeolian');
  
  scalesDropdown.option('--- Other ---', 'disabled');
  scalesDropdown.option('Chromatic');
  scalesDropdown.option('Harmonic Minor');
  scalesDropdown.option('Whole Tone');
  scalesDropdown.option('Octatonic');

  // Set a callback function for when an option is selected
  scalesDropdown.changed(changeScale);
  
  // Instrument dropdown
  instrumentDropdown = createSelect();
  
  // Add options to the dropdown
  instrumentDropdown.option('Select an Instrument:', '');
  instrumentDropdown.option('Comb');
  instrumentDropdown.option('Piano');
  instrumentDropdown.option('Harp');

  // Set a callback function for when an option is selected
  instrumentDropdown.changed(changeInstrument);  
  
  positionDropdownMenus();  

  // Create increment buttons
  let addButton = createImg('images/plus_ring.jpg', '+');
  addButton.size(45, 45);
  addButton.position(windowWidth - 55 - addButton.width, 30);
  addButton.mousePressed(() => {
    if (numRings < 17) {
    numRings++;
    initializePointsArray();
    drawConcentricCircles();   
    ellipseButtons = [];
    drawButtonEllipses();
    }
  });

  let removeButton = createImg('images/minus_ring.jpg', '-');
  removeButton.size(45, 45);
  removeButton.position(windowWidth - 60- removeButton.width - addButton.width, 30);
  removeButton.mousePressed(() => {
    if (numRings > 6) {
      numRings--;
      initializePointsArray();
      drawConcentricCircles();
      ellipseButtons = [];
      drawButtonEllipses();
    }
  });
  
  // create metro icon for tempo control
  metroImage = createImg('images/metro_icon.jpg', 'tempo');
  metroImage.size(45, 45);
  metroImage.position(30 + playButton.width, 30)
  
  // Create duration slider
  durationSlider = createSlider(100, 1000, 550);
  durationSlider.position(25 + playButton.width + metroImage.width, 40);
  durationSlider.style('width', '80px');
  durationSlider.value(550);
  durationSlider.addClass("mySliders");  

  // Create offscreen graphics buffer
  graphics = createGraphics(windowWidth, windowHeight);

  drawConcentricCircles();
  
  drawButtonEllipses();
}

function draw() {
  background(250);
  
  let currentAngle = 0;

  if (isPlaying) {
    duration_init = durationSlider.value();
    duration = map(duration_init, 100, 1000, 1000, 100);

    // Calculate the elapsed time and current angle
    let elapsedTime = millis() - startTime;
    let totalRotationDuration = numSegments * duration;
    currentAngle = -(elapsedTime % totalRotationDuration) / totalRotationDuration * TWO_PI; // Reversed direction by negating currentAngle
  }

  // Draw the static parts (circle) from the buffer
  image(graphics, 0, 0);
  image(buttonGraphics, 0, 0);
  // Translate and rotate the scene
  push();
  translate(circleCenterX, circleCenterY);
  rotate(currentAngle);
  translate(-circleCenterX, -circleCenterY);

  let angleIncrement = TWO_PI / numSegments;
  let radiusIncrement = circleRadius / numRings;
  
  drawButtonEllipses();

  // Precalculate angles for each segment
  let segmentAngles = [];
  for (let j = 0; j < numSegments; j++) {
    let quantizedAngle = j * angleIncrement;
    segmentAngles.push(atan2(sin(quantizedAngle), cos(quantizedAngle)) + HALF_PI);
  } 

  // Draw the arc - you can't create notes here
  let arcRadius = (circleRadius * 1.06) + radiusIncrement * numRings; // Adjust this value as needed
  let arcStartAngle = 3.45; // Starting angle of the arc
  let arcEndAngle = 3.8; // Ending angle of the arc (adjust as needed)
  noStroke();
  fill(90,90,90,15); // Black color
  arc(circleCenterX, circleCenterY, arcRadius, arcRadius, arcStartAngle, arcEndAngle);  
  
  for (let i = 3; i <= numRings; i++) { // Start from 8 to exclude center
    let quantizedRadius = i * radiusIncrement;
    for (let j = 0; j < numSegments; j++) {
      if (j === gapIndex) continue; // Skip drawing and playback at the gap index

      let quantizedX = circleCenterX + quantizedRadius * cos(j * angleIncrement);
      let quantizedY = circleCenterY + quantizedRadius * sin(j * angleIncrement);

      // Draw solid point if it exists
      if (points[i][j]) {
        push(); // Save the current drawing state
        translate(quantizedX, quantizedY); // Move the origin to the current point
        rotate(segmentAngles[j]); // Rotate the ellipse to be perpendicular to the center of the circle
        fill(0, 170);
        noStroke();
        rect(0, 0, radiusIncrement * 0.6, radiusIncrement / 2); // Draw the squares
        pop();
      }
    }
  }
  pop();
}

function touchStarted() {
  if (touches.length > 0) {
    let touchX = touches[0].x;
    let touchY = touches[0].y;

    let d = dist(touchX, touchY, circleCenterX, circleCenterY);

    // Check if the touch is within the bounds of the inner circle
    if (d <= circleRadius + 12) {
      let adjustedTouchX = touchX;
      let adjustedTouchY = touchY;

      if (isPlaying) {
        // Calculate the current angle of rotation
        let elapsedTime = millis() - startTime;
        let totalRotationDuration = numSegments * duration;
        let currentAngle = -(elapsedTime % totalRotationDuration) / totalRotationDuration * TWO_PI; // Reversed direction by negating currentAngle

        // Apply the inverse of the current rotation to the touch coordinates
        adjustedTouchX = cos(-currentAngle) * (touchX - circleCenterX) - sin(-currentAngle) * (touchY - circleCenterY) + circleCenterX;
        adjustedTouchY = sin(-currentAngle) * (touchX - circleCenterX) + cos(-currentAngle) * (touchY - circleCenterY) + circleCenterY;
      }
      

      // Check if any button was clicked
      let buttonClicked = false;
      for (let btn of ellipseButtons) {      
        let d = dist(touchX, touchY, btn.x, btn.y);
        if (d < btn.size / 1.9) {
          updateIndividualInstrumentArray(btn.id);
          buttonClicked = true;
          break; // Exit loop since a button was clicked
        }        
      }

      // Only toggle points if no button was clicked
      if (!buttonClicked) {      

        // Get the closest quantized indices using the adjusted touch coordinates
        let [rIndex, aIndex] = getClosestQuantizedIndices(adjustedTouchX, adjustedTouchY);
        if (rIndex > 0) { // Only handle points if rIndex is greater than 0
          points[rIndex][aIndex] = !points[rIndex][aIndex]; // Toggle the point
        }
      }
    }
  }
}

function mousePressed() { // duplicate of touch started
  let d = dist(mouseX, mouseY, circleCenterX, circleCenterY);
  if (d <= circleRadius + 12) {
    let adjustedMouseX = mouseX;
    let adjustedMouseY = mouseY;
    if (isPlaying) {
      let elapsedTime = millis() - startTime;
      let totalRotationDuration = numSegments * duration;
      let currentAngle = -(elapsedTime % totalRotationDuration) / totalRotationDuration * TWO_PI;
      adjustedMouseX = cos(-currentAngle) * (mouseX - circleCenterX) - sin(-currentAngle) * (mouseY - circleCenterY) + circleCenterX;
      adjustedMouseY = sin(-currentAngle) * (mouseX - circleCenterX) + cos(-currentAngle) * (mouseY - circleCenterY) + circleCenterY;
    }

    // Check if any button was clicked
    let buttonClicked = false;
    for (let btn of ellipseButtons) {      
      let d = dist(mouseX, mouseY, btn.x, btn.y);
      if (d < btn.size / 1.9) {
        updateIndividualInstrumentArray(btn.id);
        buttonClicked = true;
        break; // Exit loop since a button was clicked
      }        
    }

    if (!buttonClicked) {
      let [rIndex, aIndex] = getClosestQuantizedIndices(adjustedMouseX, adjustedMouseY);
      if (rIndex > 0) {
        points[rIndex][aIndex] = !points[rIndex][aIndex];
      }
    }
  }      
}


function getClosestQuantizedIndices(x, y) {
  let angleIncrement = TWO_PI / numSegments;
  let radiusIncrement = circleRadius / numRings;

  let minDist = Infinity;
  let closestRIndex, closestAIndex;

  for (let i = 3; i <= numRings; i++) {
    let quantizedRadius = i * radiusIncrement;
    for (let j = 0; j < numSegments; j++) {
      let quantizedAngle = j * angleIncrement;
      let quantizedX = circleCenterX + quantizedRadius * cos(quantizedAngle);
      let quantizedY = circleCenterY + quantizedRadius * sin(quantizedAngle);
      let d = dist(x, y, quantizedX, quantizedY);
      if (d < minDist) {
        minDist = d;
        closestRIndex = i;
        closestAIndex = j;
      }
    }
  }

  return [closestRIndex, closestAIndex];
}

function initializePointsArray(clear = false) {
  let newPoints = [];
  for (let i = 0; i <= numRings; i++) {
    newPoints[i] = [];
    for (let j = 0; j < numSegments; j++) {
      if (!clear && points && points[i] && points[i][j] !== undefined) {
        newPoints[i][j] = points[i][j];
      } else {
        newPoints[i][j] = false;
      }
    }
  }
  points = newPoints;
}

function playSound(buffer) {
  let source = audioContext.createBufferSource();
  source.buffer = buffer;
  let gainNode = audioContext.createGain();
  gainNode.gain.value = 0.2;
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0);
}

function createPlayButton() {
  playButton = createImg('images/play_icon.jpg', '▶');   
  playButton.size(45, 45); 
  playButton.position(20, 30);
  playButton.mousePressed(togglePlayback);
}

function createClearButton() {
  clearButton = createImg('images/bin_icon.jpg', '✖');
  clearButton.size(45, 45);
  clearButton.position(windowWidth-50, 30);
  clearButton.mousePressed(() => {
    initializePointsArray(true); // Clear all points
  });
}

function playAllNotes(startSegmentIndex) {
  if (timeoutIds.length > 0) {
    return;
  }

  isPlaying = true;

  let loopFunction = () => {
    for (let j = startSegmentIndex; j < numSegments + startSegmentIndex; j++) {
      let adjustedIndex = j % numSegments;
      if (adjustedIndex === gapIndex) continue;
      let timeoutId = setTimeout(() => {
        if (!isPlaying) {
          clearTimeouts();
          return;
        }

        for (let i = 3; i <= numRings; i++) {
          if (points[i][adjustedIndex]) {
            let bufferIndex = scaleMappings[i - 3];
            playSound(audioBuffers[bufferIndex]);
          }
        }
      }, (j - startSegmentIndex) * duration);
      timeoutIds.push(timeoutId);
    }
    if (isPlaying) {
      let timeoutId = setTimeout(loopFunction, numSegments * duration);
      timeoutIds.push(timeoutId);
    }
  };
  loopFunction();
}

function clearTimeouts() {
  timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
  timeoutIds = [];
}

function togglePlayback() {
  if (!isPlaying) {
    let duration_init = durationSlider.value();
    duration = map(duration_init, 100, 1000, 1000, 100);
    isPlaying = true;
    startTime = millis();
    playAllNotes(10); // index to start playing from
    playButton.attribute('src', 'images/stop_icon.jpg'); // Change to stop icon
    durationSlider.attribute('disabled', '');
  } else {
    // Stop playback
    isPlaying = false;
    clearTimeouts();
    playButton.attribute('src', 'images/play_icon.jpg'); // Change back to play icon
    durationSlider.removeAttribute('disabled');
  }
}

function resizeCanvasToWindow() {
  resizeCanvas(windowWidth, windowHeight);
  circleCenterX = windowWidth / 2;
  circleCenterY = windowHeight / 2;
  
  let baseRadius = Math.min(windowWidth, windowHeight) * 0.4;
  circleRadius = baseRadius;
  innerCircleRadius = baseRadius * 0.6;
  
  redraw();
}

function drawConcentricCircles() {
  graphics.clear(); // Clear the graphics buffer
  graphics.noFill();
  graphics.stroke(0, 50);
  graphics.strokeWeight(0);
  graphics.ellipse(circleCenterX, circleCenterY, circleRadius * 2.1);

  // Draw border around sketch
  graphics.stroke(0, 50);
  graphics.strokeWeight(3);
  graphics.noFill();
  graphics.rect(0, 0, windowWidth, windowHeight);

  // Draw concentric circles on the graphics buffer
  graphics.strokeWeight(1);
  graphics.stroke(0, 25);
  let radiusIncrement = circleRadius / numRings;
  let offset = radiusIncrement/5; // Adjust this value as needed for the desired offset

  // Draw the additional smallest circle
  let smallestRadius = radiusIncrement * 2.2;
  graphics.ellipse(circleCenterX, circleCenterY, smallestRadius * 2);

  for (let i = 3; i <= numRings; i++) { // Start from 8 to exclude the center
    let currentRadius = i * radiusIncrement + offset;
    graphics.ellipse(circleCenterX, circleCenterY, currentRadius * 2);
  }
}

function changeScale() {
  // Handle the change in scale selection here
  let selectedScale = scalesDropdown.value();
  if (selectedScale !== 'disabled') {
    // Process selected scale
    if (selectedScale === 'Major') {// pentatonic
      scaleMappings = majorPentatonic;
    } 
    if (selectedScale === 'Minor') {// pentatonic
      scaleMappings = minorPentatonic;
    }     
    if (selectedScale === 'Ionian') {
      scaleMappings = ionian;
    }
    if (selectedScale === 'Dorian') {
      scaleMappings = dorian;
    }
    if (selectedScale === 'Mixolydian') {
      scaleMappings = mixolydian;
    }
    if (selectedScale === 'Aeolian') {
      scaleMappings = aeolian;
    }
    if (selectedScale === 'Chromatic') {
      scaleMappings = chromatic;
    }
    if (selectedScale === 'Harmonic Minor') {
      scaleMappings = harmonicMinor;
    }    
    if (selectedScale === 'Whole Tone') {
      scaleMappings = wholeTone;
    }
    if (selectedScale === 'Octatonic') {
      scaleMappings = octatonic;
    }
  }
}

function changeInstrument() {
  // Initialise new sample set here
  let selectedInstrument = instrumentDropdown.value();
  if (selectedInstrument !== 'disabled') {
    // Process selected scale
    
    if (selectedInstrument === 'Comb') {
      individualInstrumentArray = new Array(37).fill(1);
    }    
    
    if (selectedInstrument === 'Piano') {
      individualInstrumentArray = new Array(37).fill(2);
    }
    if (selectedInstrument === 'Harp') {
      individualInstrumentArray = new Array(37).fill(3);
    }
    console.log('Selected instrument:', selectedInstrument);
    
    loadAudioSet(individualInstrumentArray);
  }
}

function updateIndividualInstrumentArray(indexToUpdate) {
  // Clear previous debounce timer
  clearTimeout(debounceTimerArray);

  // Set a new debounce timer
  debounceTimerArray = setTimeout(() => {
    // Ensure indexToUpdate is within valid range
    if (indexToUpdate >= 0 && indexToUpdate < individualInstrumentArray.length) {
      
      // map the value according to scale dictionary
      indexToUpdate = scaleMappings[indexToUpdate];
      
      
      // Update the value at the specified indexToUpdate
      // Increment the value and constrain it to 1, 2, or 3
      individualInstrumentArray[indexToUpdate] = (individualInstrumentArray[indexToUpdate] % 3) + 1;
      
      // Reload audio set with updated individualInstrumentArray
      loadAudioSet(individualInstrumentArray);
    }
  }, 50); // Adjust debounce delay as needed (e.g., 50 milliseconds)
}

function positionDropdownMenus() {
  scalesDropdown.position(windowWidth/2, windowHeight - 25);
  
  instrumentDropdown.position(10, windowHeight - 25);
}

function drawButtonEllipses() {
  let radiusIncrement = circleRadius / numRings;
  let stationary_angle = -PI / 1.18; // Same angle as the stationary line
  let offsetFactor = -0.3; // Fraction of the radius increment to offset the buttons by
  
  buttonGraphics.clear();

  for (let i = 3; i <= numRings; i++) { // Start from 8 to exclude center
    let quantizedRadius = i * radiusIncrement;
    let buttonSize = radiusIncrement * 0.95; // Scale button size with radius increment
    
    // Calculate the position for each ellipse based on the stationary angle
    let buttonX = circleCenterX + (quantizedRadius + radiusIncrement * offsetFactor) * cos(stationary_angle);
    let buttonY = circleCenterY + (quantizedRadius + radiusIncrement * offsetFactor) * sin(stationary_angle);
    
    // Adjust color index using scaleMappings
    let originalIndex = scaleMappings[i - 3];
    let colIndex = individualInstrumentArray[originalIndex] - 1;
    buttonGraphics.fill(ellipseColors[colIndex]); // ellipse color    

    // Draw the ellipse at the calculated position
    ellipseButtons.push({ id: i-3, x: buttonX, y: buttonY, size: buttonSize });
    buttonGraphics.noStroke();
    buttonGraphics.ellipse(buttonX, buttonY, buttonSize, buttonSize);
  }
}