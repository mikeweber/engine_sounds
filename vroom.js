let throttleSlider, throttleStatus, activeEngine
const engines = {};

(function() {
  throttleSlider = document.getElementById("throttle")
  throttleStatus = document.getElementById("rpms")
  buildEngines()
  activeEngine = selectEngine("inline6")

  throttleSlider.value = activeEngine.rpms
  showThrottle(activeEngine.rpms)

  setTimeout(function() {
    runEngine(activeEngine)
  }, 1000)

  throttleSlider.addEventListener("input", setThrottle)
})()

function buildEngines() {
  const audioCtx = new AudioContext()

  engines.standard4  = new Engine(audioCtx, [{ phase: 0.0, number: 1 }, { phase: 0.5, number: 4 }, { phase: 1.0, number: 2 }, { phase: 1.5, number: 3 }])
  engines.crossplane = new Engine(audioCtx, [{ phase: 0.0, number: 2 }, { phase: 0.25, number: 3 }, { phase: 0.375, number: 1 }, { phase: 0.625, number: 4 }])
  engines.inline6    = new Engine(audioCtx, [{ phase: 0.0, number: 1 }, { phase: 1.0 / 3.0, number: 5 }, { phase: 2.0 / 3.0, number: 3 }, { phase: 1.0, number: 6 }, { phase: 4.0 / 3.0, number: 2 }, { phase: 5.0 / 3.0, number: 4 }])
}

function selectEngine(name) {
  const engine = engines[name]
  if (!engine) return alert("Could not find engine with name " + name)

  engine.setThrottle(60)
  engine.running = true
  return engine
}

function setThrottle(e) {
  activeEngine.setThrottle(e.target.value)
  showThrottle(e.target.value)
}

function showThrottle(value) {
  if (!throttleStatus) return

  throttleStatus.innerHTML = value
}

function runEngine(engine) {
  let timeLapse = engine.run()
  setTimeout(function() { runEngine(engine) }, timeLapse)
}

function Engine(audioCtx, phases) {
  this.running = false
  this.cylinders = []
  this.activeCylinderIndex = 0
  this.ms_per_rev = 0

  this.setThrottle = function(rpms) {
    this.rpms = rpms
    this.ms_per_rev = 60 / rpms * 1000
  }

  this.setThrottle(60)

  for (let i = 0; i < phases.length; i++) {
    let phase = phases[i].phase
    let num = phases[i].number
    this.cylinders.push(new Cylinder(num, phase, audioCtx))
  }

  this.run = function() {
    if (!this.running) return

    let activeCylinder = this.cylinders[this.activeCylinderIndex]
    activeCylinder.fire(this.ms_per_rev)
    this.activeCylinderIndex = (this.activeCylinderIndex + 1) % this.cylinders.length
    let nextCylinder = this.cylinders[this.activeCylinderIndex]
    let diff = nextCylinder.phase - activeCylinder.phase
    if (diff < 0) diff = 2 - activeCylinder.phase

    return diff * this.ms_per_rev
  }.bind(this)
}

function Cylinder(order, phase, audioCtx) {
  this.order = order
  this.phase = phase
  this.ui = document.getElementById("cylinder" + order)

  this.fire = function(ms_per_rev) {
    this.bang()
    this.highlightCylinder(ms_per_rev)
  }

  this.bang = function() {
    const oscillator = audioCtx.createOscillator()
    oscillator.connect(audioCtx.destination)
    // set options for the oscillator
    oscillator.frequency.value = 120
    oscillator.type = "square"
    const offset = 0.01
    oscillator.start(offset + audioCtx.currentTime)
    oscillator.stop(offset + audioCtx.currentTime + 0.005)
  }

  this.highlightCylinder = function(ms_per_rev) {
    this.ui.classList.add("active")
    setTimeout(function() { this.ui.classList.remove("active") }.bind(this), ms_per_rev / 4)
  }
}

