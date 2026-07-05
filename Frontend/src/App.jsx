// frontend/src/App.jsx
//
// This shows the connection point: App.jsx never imports sortingAlgorithms.js
// directly. Instead it imports the useSortingVisualizer hook, which internally
// imports ALGORITHMS + generateRandomArray from sortingAlgorithms.js.
//
//   sortingAlgorithms.js  --(imported by)-->  useSortingVisualizer.js  --(used by)-->  App.jsx
//
// This keeps App.jsx focused on layout/composition, while all the "how do I
// actually animate a sort" logic lives in one reusable hook.

import { useCallback, useMemo } from 'react';
import { useSortingVisualizer } from './hooks/useSortingVisualizer';
import { saveSimulation } from './services/api';

function App() {
  // Called automatically by the hook the instant a sort finishes.
  const handleSortComplete = useCallback(async (stats) => {
    try {
      await saveSimulation(stats);
    } catch (error) {
      // Don't let a failed network call break the UI — just log it.
      console.error('Failed to save simulation stats:', error);
    }
  }, []);

  const {
    array,
    barStates,
    algorithmName,
    arraySize,
    speed,
    isPlaying,
    isSorted,
    liveStats,
    algorithmNames,
    play,
    pause,
    reset,
    changeArraySize,
    changeAlgorithm,
    setSpeed,
  } = useSortingVisualizer({
    initialSize: 50,
    initialSpeed: 30,
    onComplete: handleSortComplete,
  });

  // Bars are sized as a PERCENTAGE of the tallest value currently in the
  // array, not raw pixels. Raw pixel heights (e.g. a value of 500) would
  // simply overflow a fixed-height container — normalizing against the max
  // guarantees the tallest bar always exactly fills the container and every
  // other bar is proportionally shorter, no matter what range of values
  // generateRandomArray() produces.
  const maxValue = useMemo(() => Math.max(...array, 1), [array]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Sorting Algorithm Visualizer</h1>

      {/* --- Bars --- */}
      {/* overflow-hidden is a safety net; with percentage heights it should
          never actually be needed, but guards against any edge case (e.g. a
          transient 0-length array) from ever visually breaking the layout. */}
      <div className="flex items-end gap-[2px] h-72 bg-slate-800 rounded-lg p-4 overflow-hidden">
        {array.map((value, index) => (
          <div
            key={index}
            className={
              'flex-1 rounded-t transition-all duration-150 ' +
              (barStates[index] === 'comparing'
                ? 'bg-red-500'
                : barStates[index] === 'swapping'
                ? 'bg-yellow-400'
                : barStates[index] === 'sorted'
                ? 'bg-green-500'
                : 'bg-sky-500')
            }
            style={{ height: `${(value / maxValue) * 100}%` }}
          />
        ))}
      </div>

      {/* --- Controls (full ControlPanel component comes next) --- */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        <select
          value={algorithmName}
          onChange={(e) => changeAlgorithm(e.target.value)}
          disabled={isPlaying}
          className="bg-slate-800 rounded px-3 py-2"
        >
          {algorithmNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2">
          Size: {arraySize}
          <input
            type="range"
            min={5}
            max={200}
            value={arraySize}
            disabled={isPlaying}
            onChange={(e) => changeArraySize(Number(e.target.value))}
          />
        </label>

        <label className="flex items-center gap-2">
          Speed
          <input
            type="range"
            min={1}
            max={200}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </label>

        <button onClick={play} disabled={isPlaying || isSorted} className="bg-emerald-600 px-4 py-2 rounded">
          Play
        </button>
        <button onClick={pause} disabled={!isPlaying} className="bg-amber-600 px-4 py-2 rounded">
          Pause
        </button>
        <button onClick={reset} className="bg-slate-600 px-4 py-2 rounded">
          Reset / New Array
        </button>

        <span className="ml-auto text-sm text-slate-300">
          Comparisons: {liveStats.comparisons} &nbsp;|&nbsp; Swaps: {liveStats.swaps}
        </span>
      </div>
    </div>
  );
}

export default App;