import  Header from './components/Header';
import Simulator from './components/Simulator';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Explore the Physics of Motion
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Dive into the fascinating world of pendulum physics with our interactive simulator. 
          </p>
          <a
            href="#simulator"
            className="inline-block py-3 px-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
          >
            Try the Simulator
          </a>
        </div>
      </section>

      <Simulator />
    </div>
  );
}
 