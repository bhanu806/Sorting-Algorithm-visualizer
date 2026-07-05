// frontend/src/utils/sortingAlgorithms.js
//
// Each sorting function below does NOT mutate the UI directly. Instead it
// runs the algorithm against a plain copy of the input array and records a
// linear list of "steps" describing what happened. The React visualizer
// later replays these steps one-by-one (via setTimeout/requestAnimationFrame)
// to animate bars, independent of how fast the algorithm itself runs.
//
// STEP SCHEMA (every step is a plain object with a `type` field):
//   { type: 'compare',   indices: [i, j] }        // comparing two bars
//   { type: 'swap',      indices: [i, j] }        // swap values at i and j
//   { type: 'overwrite', index: i, value: v }     // set array[i] = v (used by merge/heap)
//   { type: 'sorted',    index: i }               // mark index i as permanently sorted
//
// Each function returns:
//   {
//     steps: Step[],
//     comparisons: number,
//     swaps: number,          // includes overwrites, since those are the
//                              // "write operations" for non-swap-based algos
//   }

/**
 * Bubble Sort — repeatedly steps through the array, swapping adjacent
 * elements that are out of order.
 * Time: O(n^2) worst/average, O(n) best (with early-exit optimization)
 */
export function bubbleSort(inputArray) {
  const array = [...inputArray];
  const steps = [];
  let comparisons = 0;
  let swaps = 0;
  const n = array.length;

  for (let i = 0; i < n - 1; i++) {
    let swappedThisPass = false;

    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({ type: 'compare', indices: [j, j + 1] });
      comparisons++;

      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        steps.push({ type: 'swap', indices: [j, j + 1] });
        swaps++;
        swappedThisPass = true;
      }
    }

    // The last element of this pass is now in its final sorted position.
    steps.push({ type: 'sorted', index: n - 1 - i });

    if (!swappedThisPass) break; // Already sorted — stop early.
  }

  // Mark any remaining unmarked indices (e.g. index 0 when early-exit fires) as sorted.
  steps.push({ type: 'sorted', index: 0 });

  return { steps, comparisons, swaps };
}

/**
 * Selection Sort — repeatedly finds the minimum of the unsorted suffix and
 * swaps it into place.
 * Time: O(n^2) in all cases.
 */
export function selectionSort(inputArray) {
  const array = [...inputArray];
  const steps = [];
  let comparisons = 0;
  let swaps = 0;
  const n = array.length;

  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;

    for (let j = i + 1; j < n; j++) {
      steps.push({ type: 'compare', indices: [minIndex, j] });
      comparisons++;

      if (array[j] < array[minIndex]) {
        minIndex = j;
      }
    }

    if (minIndex !== i) {
      [array[i], array[minIndex]] = [array[minIndex], array[i]];
      steps.push({ type: 'swap', indices: [i, minIndex] });
      swaps++;
    }

    steps.push({ type: 'sorted', index: i });
  }

  steps.push({ type: 'sorted', index: n - 1 });

  return { steps, comparisons, swaps };
}

/**
 * Insertion Sort — builds the sorted array one element at a time by
 * shifting larger elements to the right.
 * Time: O(n^2) worst/average, O(n) best (nearly-sorted input).
 */
export function insertionSort(inputArray) {
  const array = [...inputArray];
  const steps = [];
  let comparisons = 0;
  let swaps = 0;
  const n = array.length;

  steps.push({ type: 'sorted', index: 0 });

  for (let i = 1; i < n; i++) {
    let j = i;

    while (j > 0) {
      steps.push({ type: 'compare', indices: [j - 1, j] });
      comparisons++;

      if (array[j - 1] > array[j]) {
        [array[j - 1], array[j]] = [array[j], array[j - 1]];
        steps.push({ type: 'swap', indices: [j - 1, j] });
        swaps++;
        j--;
      } else {
        break;
      }
    }
  }

  for (let i = 0; i < n; i++) {
    steps.push({ type: 'sorted', index: i });
  }

  return { steps, comparisons, swaps };
}

/**
 * Merge Sort — divide and conquer: recursively split the array, then merge
 * sorted halves back together. Uses `overwrite` steps since merging writes
 * values rather than swapping pairs.
 * Time: O(n log n) in all cases. Space: O(n).
 */
export function mergeSort(inputArray) {
  const array = [...inputArray];
  const steps = [];
  let comparisons = 0;
  let swaps = 0; // counts overwrites (array writes)

  function merge(start, mid, end) {
    const left = array.slice(start, mid + 1);
    const right = array.slice(mid + 1, end + 1);

    let i = 0;
    let j = 0;
    let k = start;

    while (i < left.length && j < right.length) {
      // Compare the *original* indices these values came from for visual accuracy.
      steps.push({ type: 'compare', indices: [start + i, mid + 1 + j] });
      comparisons++;

      if (left[i] <= right[j]) {
        array[k] = left[i];
        steps.push({ type: 'overwrite', index: k, value: left[i] });
        i++;
      } else {
        array[k] = right[j];
        steps.push({ type: 'overwrite', index: k, value: right[j] });
        j++;
      }
      swaps++;
      k++;
    }

    while (i < left.length) {
      array[k] = left[i];
      steps.push({ type: 'overwrite', index: k, value: left[i] });
      swaps++;
      i++;
      k++;
    }

    while (j < right.length) {
      array[k] = right[j];
      steps.push({ type: 'overwrite', index: k, value: right[j] });
      swaps++;
      j++;
      k++;
    }
  }

  function sort(start, end) {
    if (start >= end) return;
    const mid = Math.floor((start + end) / 2);
    sort(start, mid);
    sort(mid + 1, end);
    merge(start, mid, end);
  }

  sort(0, array.length - 1);

  for (let i = 0; i < array.length; i++) {
    steps.push({ type: 'sorted', index: i });
  }

  return { steps, comparisons, swaps };
}

/**
 * Quick Sort — divide and conquer using a pivot (last element of each
 * partition) with the Lomuto partition scheme.
 * Time: O(n log n) average, O(n^2) worst case (already-sorted input with
 * this pivot choice).
 */
export function quickSort(inputArray) {
  const array = [...inputArray];
  const steps = [];
  let comparisons = 0;
  let swaps = 0;

  function partition(low, high) {
    const pivot = array[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      steps.push({ type: 'compare', indices: [j, high] });
      comparisons++;

      if (array[j] < pivot) {
        i++;
        if (i !== j) {
          [array[i], array[j]] = [array[j], array[i]];
          steps.push({ type: 'swap', indices: [i, j] });
          swaps++;
        }
      }
    }

    if (i + 1 !== high) {
      [array[i + 1], array[high]] = [array[high], array[i + 1]];
      steps.push({ type: 'swap', indices: [i + 1, high] });
      swaps++;
    }

    return i + 1;
  }

  function sort(low, high) {
    if (low < high) {
      const pivotIndex = partition(low, high);
      steps.push({ type: 'sorted', index: pivotIndex });
      sort(low, pivotIndex - 1);
      sort(pivotIndex + 1, high);
    } else if (low === high) {
      steps.push({ type: 'sorted', index: low });
    }
  }

  sort(0, array.length - 1);

  return { steps, comparisons, swaps };
}

/**
 * Heap Sort — builds a max-heap, then repeatedly extracts the max element
 * to the end of the array.
 * Time: O(n log n) in all cases.
 */
export function heapSort(inputArray) {
  const array = [...inputArray];
  const steps = [];
  let comparisons = 0;
  let swaps = 0;
  const n = array.length;

  function heapify(size, rootIndex) {
    let largest = rootIndex;
    const left = 2 * rootIndex + 1;
    const right = 2 * rootIndex + 2;

    if (left < size) {
      steps.push({ type: 'compare', indices: [left, largest] });
      comparisons++;
      if (array[left] > array[largest]) largest = left;
    }

    if (right < size) {
      steps.push({ type: 'compare', indices: [right, largest] });
      comparisons++;
      if (array[right] > array[largest]) largest = right;
    }

    if (largest !== rootIndex) {
      [array[rootIndex], array[largest]] = [array[largest], array[rootIndex]];
      steps.push({ type: 'swap', indices: [rootIndex, largest] });
      swaps++;
      heapify(size, largest);
    }
  }

  // Build the max-heap.
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(n, i);
  }

  // Repeatedly move the current max (root) to the end.
  for (let i = n - 1; i > 0; i--) {
    [array[0], array[i]] = [array[i], array[0]];
    steps.push({ type: 'swap', indices: [0, i] });
    swaps++;

    steps.push({ type: 'sorted', index: i });
    heapify(i, 0);
  }

  steps.push({ type: 'sorted', index: 0 });

  return { steps, comparisons, swaps };
}

// Registry mapping display names (used in the algorithm dropdown and saved
// to MongoDB) to their implementation. Keeping this in one place means the
// frontend dropdown and the backend's allowed-enum values stay in sync.
export const ALGORITHMS = {
  'Bubble Sort': bubbleSort,
  'Selection Sort': selectionSort,
  'Insertion Sort': insertionSort,
  'Merge Sort': mergeSort,
  'Quick Sort': quickSort,
  'Heap Sort': heapSort,
};

/**
 * Generates a random array of the given size with values between min and max (inclusive).
 */
export function generateRandomArray(size, min = 5, max = 500) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}