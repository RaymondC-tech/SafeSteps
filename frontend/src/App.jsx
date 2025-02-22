import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifi, faBatteryFull, faMicrophone, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import MapComponent from './components/MapComponent';

const App = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      
      <div className="w-[375px] h-[700px] bg-white rounded-[40px] shadow-lg border-4 border-black relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-12 bg-gray-800 flex justify-between items-center px-4 text-white">
          <div className="text-sm">Fido</div>
          <div className="flex space-x-2">
            <FontAwesomeIcon icon={faWifi} className="text-white w-4 h-4" /> {/* Wi-Fi icon */}
            <FontAwesomeIcon icon={faBatteryFull} className="text-white w-4 h-4" /> {/* Battery icon */}
          </div>
        </div>

        <div className="absolute top-12 left-0 right-0 h-12 bg-gray-600 flex items-center px-4">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-300 w-4 h-4 mr-2" /> {/* Magnifying glass icon */}
          <div className="text-sm text-gray-300 text-center flex-grow">randomtext.com</div>
          <div className="ml-2">
            <FontAwesomeIcon icon={faMicrophone} className="text-gray-300 w-4 h-4" /> {/* Microphone icon */}
          </div>
        </div>

        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-b-lg"></div>

        <MapComponent />
        <div className="p-4 h-full overflow-y-auto">
  
        </div>
      </div>
    </div>
  );
};


export default App;
