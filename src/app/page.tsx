export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to FrugalRx</h1>
      <p className="text-xl mb-4">
        Finding affordable medications made simple
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Search Medications</h2>
          <p>Compare prices across different pharmacies</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Save Money</h2>
          <p>Find the best deals on your prescriptions</p>
        </div>
      </div>
    </main>
  );
}
