# Sorting Algorithm Visualizer

A full-stack web application that provides real-time visualization of sorting algorithms. This project helps users understand how different sorting algorithms work by visualizing their step-by-step execution.

## 🎯 Features

- **Real-time Algorithm Visualization** - Watch sorting algorithms execute step-by-step with animated visualizations
- **Multiple Sorting Algorithms** - Supports various sorting techniques including Bubble Sort, Merge Sort, Quick Sort, and more
- **Interactive Controls** - Start, pause, and control simulation speed
- **Performance Analytics** - View algorithm statistics and performance metrics
- **Responsive Design** - Seamless experience across desktop and tablet devices
- **Persistent Storage** - Save and retrieve simulation data from the database

## 🛠️ Tech Stack

### Frontend
- **React** - UI library with functional components and hooks
- **Vite** - Fast build tool and development server
- **CSS3** - Responsive styling
- **Axios** - HTTP client for API requests

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or MongoDB Atlas)

### Clone the Repository
```bash
git clone <repository-url>
cd Sorting-Algorithm-visualizer
```

### Backend Setup
```bash
cd Backend
npm install
```

Create a `.env` file in the Backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sorting-visualizer
NODE_ENV=development
```

### Frontend Setup
```bash
cd Frontend
npm install
```

## 🚀 Running the App

### Run Backend
```bash
cd Backend
npm start
```
The backend server will run on `http://localhost:5000`

### Run Frontend (in a new terminal)
```bash
cd Frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### Development Mode
For development with auto-reload:

**Backend:**
```bash
cd Backend
npm run dev
```
(Make sure `nodemon` is installed: `npm install nodemon`)

**Frontend:**
```bash
cd Frontend
npm run dev
```

## 📁 Project Structure

```
Sorting-Algorithm-visualizer/
├── Backend/
│   ├── controllers/
│   │   └── simulationController.js
│   ├── models/
│   │   └── Simulation.js
│   ├── routes/
│   │   └── simulationRoutes.js
│   ├── connection.js
│   ├── index.js
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   │   └── useSortingVisualizer.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── sortingAlgorithms.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 💻 Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Select a sorting algorithm from the menu
3. Click "Start" to begin the visualization
4. Use the speed controls to adjust animation speed
5. View performance metrics and statistics for each algorithm

## 🎓 Supported Algorithms

- Bubble Sort
- Selection Sort
- Insertion Sort
- Merge Sort
- Quick Sort
- Heap Sort

## 🔧 Available Scripts

### Backend
- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-reload)

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📝 API Endpoints

- `GET /api/simulations` - Fetch all simulations
- `POST /api/simulations` - Create a new simulation
- `GET /api/simulations/:id` - Get a specific simulation
- `PUT /api/simulations/:id` - Update a simulation
- `DELETE /api/simulations/:id` - Delete a simulation

## 🐛 Troubleshooting

**Backend won't start:**
- Ensure MongoDB is running
- Check if port 5000 is available
- Verify `.env` file configuration

**Frontend won't load:**
- Clear browser cache
- Check if backend is running
- Verify API endpoints in `src/services/api.js`

**Modules not found:**
- Run `npm install` in both Backend and Frontend directories
- Delete `node_modules` and reinstall if issues persist

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

Created as a full-stack web development project to demonstrate sorting algorithm concepts through interactive visualization.

---

**Happy Sorting! 🎉**
