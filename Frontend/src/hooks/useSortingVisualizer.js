// frontend/src/hooks/useSortingVisualizer.js
//
// This hook is the bridge between the pure sorting functions in
// sortingAlgorithms.js (which just compute a list of steps) and React state
// (which actually drives what's painted on screen).
//
// Responsibilities:
//   1. Hold the current array + which bars are "comparing" / "swapping" / "sorted".
//   2. Generate a new random array on demand.
//   3. Run the selected algorithm to get its step list, then play those
//      steps back one at a time using setTimeout, honoring play/pause/speed.
//   4. Track comparisons/swaps/elapsed time as it plays, and expose a
//      callback fired once sorting finishes (so App.jsx can POST the stats
//      to the backend).

import { useState, useRef, useCallback, useEffect } from 'react';
import { ALGORITHMS, generateRandomArray } from '../utils/sortingAlgorithms';

// Bar visual states — the Visualizer component maps these to colors.
export const BAR_STATE = {
  DEFAULT: 'default',
  COMPARING: 'comparing',
  SWAPPING: 'swapping',
  SORTED: 'sorted',
};

/**
 * @param {object} options
 * @param {number} options.initialSize   Initial array size.
 * @param {number} options.initialSpeed  Initial delay (ms) between steps.
 * @param {(stats: {algorithm: string, arraySize: number, executionTimeMs: number, comparisons: number, swaps: number}) => void} options.onComplete
 *        Called once a sort finishes naturally (not on reset/pause).
 */
export function useSortingVisualizer({ initialSize = 50, initialSpeed = 30, onComplete } = {}) {
  const [array, setArray] = useState(() => generateRandomArray(initialSize));
  const [barStates, setBarStates] = useState(() => new Array(initialSize).fill(BAR_STATE.DEFAULT));
  const [algorithmName, setAlgorithmName] = useState('Bubble Sort');
  const [arraySize, setArraySize] = useState(initialSize);
  const [speed, setSpeed] = useState(initialSpeed); // lower = faster
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSorted, setIsSorted] = useState(false);
  const [liveStats, setLiveStats] = useState({ comparisons: 0, swaps: 0 });

  // Refs hold data that changes during playback but shouldn't trigger
  // re-renders on their own (the step list, current index, timer handle).
  const stepsRef = useRef([]);
  const stepIndexRef = useRef(0);
  const timeoutRef = useRef(null);
  const workingArrayRef = useRef([]); // mutable copy the algorithm steps apply to
  const startTimeRef = useRef(null);
  const statsRef = useRef({ comparisons: 0, swaps: 0 });

  const clearScheduledStep = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  /**
   * Generates a brand new random array, resets all visual/playback state,
   * and (re)computes the step list for the currently selected algorithm so
   * "Play" can start immediately.
   */
  const generateNewArray = useCallback(
    (size = arraySize) => {
      clearScheduledStep();
      const newArray = generateRandomArray(size);

      setArray(newArray);
      setBarStates(new Array(size).fill(BAR_STATE.DEFAULT));
      setIsPlaying(false);
      setIsSorted(false);
      setLiveStats({ comparisons: 0, swaps: 0 });

      workingArrayRef.current = [...newArray];
      stepsRef.current = [];
      stepIndexRef.current = 0;
      statsRef.current = { comparisons: 0, swaps: 0 };
    },
    [arraySize]
  );

  /**
   * Applies a single step to the working array + bar-state array, then
   * pushes both into React state so the UI repaints.
   */
  const applyStep = useCallback((step) => {
    const arr = workingArrayRef.current;

    // IMPORTANT: mutate `arr` here, OUTSIDE any setState updater function.
    // React 18 StrictMode intentionally invokes updater callbacks twice in
    // development to surface impure updaters. If the swap/overwrite mutation
    // lived inside the setBarStates(prev => ...) callback below, a swap would
    // get applied twice — i.e. swapped, then swapped right back — which is
    // exactly why bars looked like they weren't moving for every
    // swap-based algorithm (Bubble/Selection/Insertion/Quick/Heap), while
    // Merge Sort's `overwrite` steps happened to still look correct (writing
    // the same value twice is harmless, unlike swapping twice).
    if (step.type === 'swap') {
      const [i, j] = step.indices;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    } else if (step.type === 'overwrite') {
      arr[step.index] = step.value;
    }

    setBarStates((prevStates) => {
      // This callback must now be a PURE function of prevStates — no
      // mutation of `arr` or anything else happens in here anymore.
      const next = new Array(arr.length).fill(BAR_STATE.DEFAULT);
      // Preserve any bars already marked permanently sorted.
      prevStates.forEach((state, idx) => {
        if (state === BAR_STATE.SORTED) next[idx] = BAR_STATE.SORTED;
      });

      if (step.type === 'compare') {
        const [i, j] = step.indices;
        next[i] = BAR_STATE.COMPARING;
        next[j] = BAR_STATE.COMPARING;
      } else if (step.type === 'swap') {
        const [i, j] = step.indices;
        next[i] = BAR_STATE.SWAPPING;
        next[j] = BAR_STATE.SWAPPING;
      } else if (step.type === 'overwrite') {
        next[step.index] = BAR_STATE.SWAPPING;
      } else if (step.type === 'sorted') {
        next[step.index] = BAR_STATE.SORTED;
      }

      return next;
    });

    if (step.type === 'swap' || step.type === 'overwrite') {
      setArray([...arr]);
    }
  }, []);

  /**
   * The playback loop. Schedules itself via setTimeout so `speed` (and
   * pause) can be changed live between steps without restarting the sort.
   */
  const playNextStep = useCallback(() => {
    const steps = stepsRef.current;
    const idx = stepIndexRef.current;

    if (idx >= steps.length) {
      // Finished: mark every bar sorted and report stats upward.
      setBarStates(new Array(workingArrayRef.current.length).fill(BAR_STATE.SORTED));
      setIsPlaying(false);
      setIsSorted(true);

      const executionTimeMs = Math.round(performance.now() - startTimeRef.current);
      if (onComplete) {
        onComplete({
          algorithm: algorithmName,
          arraySize: workingArrayRef.current.length,
          executionTimeMs,
          comparisons: statsRef.current.comparisons,
          swaps: statsRef.current.swaps,
        });
      }
      return;
    }

    const step = steps[idx];
    applyStep(step);

    if (step.type === 'compare') statsRef.current.comparisons += 1;
    if (step.type === 'swap' || step.type === 'overwrite') statsRef.current.swaps += 1;
    setLiveStats({ ...statsRef.current });

    stepIndexRef.current += 1;

    // `speed` is a slider value (ms delay). Clamp so it never hits 0 and hangs.
    timeoutRef.current = setTimeout(playNextStep, Math.max(speed, 1));
  }, [applyStep, algorithmName, onComplete, speed]);

  /** Starts (or resumes) playback. Computes the step list on first play. */
  const play = useCallback(() => {
    if (isSorted) return; // Nothing to do — already sorted.

    if (stepsRef.current.length === 0) {
      // First time playing this array: run the algorithm to get all steps.
      const sortFn = ALGORITHMS[algorithmName];
      const { steps } = sortFn(workingArrayRef.current);
      stepsRef.current = steps;
      stepIndexRef.current = 0;
      statsRef.current = { comparisons: 0, swaps: 0 };
      startTimeRef.current = performance.now();
    }

    setIsPlaying(true);
    clearScheduledStep();
    timeoutRef.current = setTimeout(playNextStep, Math.max(speed, 1));
  }, [algorithmName, isSorted, playNextStep, speed]);

  /** Pauses playback in place — steps remain queued so play() can resume. */
  const pause = useCallback(() => {
    clearScheduledStep();
    setIsPlaying(false);
  }, []);

  /** Resets to a fresh array of the current size (new random values). */
  const reset = useCallback(() => {
    generateNewArray(arraySize);
  }, [generateNewArray, arraySize]);

  // Whenever the user changes array size via the slider, regenerate the array.
  const changeArraySize = useCallback(
    (size) => {
      setArraySize(size);
      generateNewArray(size);
    },
    [generateNewArray]
  );

  // Whenever the user picks a new algorithm, the queued steps are stale — clear them.
  const changeAlgorithm = useCallback((name) => {
    setAlgorithmName(name);
    clearScheduledStep();
    stepsRef.current = [];
    stepIndexRef.current = 0;
    setIsPlaying(false);
  }, []);

  // Clean up any pending timeout if the component unmounts mid-sort.
  useEffect(() => () => clearScheduledStep(), []);

  return {
    // State to render
    array,
    barStates,
    algorithmName,
    arraySize,
    speed,
    isPlaying,
    isSorted,
    liveStats,
    algorithmNames: Object.keys(ALGORITHMS),

    // Actions
    play,
    pause,
    reset,
    generateNewArray,
    changeArraySize,
    changeAlgorithm,
    setSpeed,
  };
}