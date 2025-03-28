import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between">
      <h1 className="text-xl font-bold">Translator App</h1>
      <nav>
        <Link className="px-3" to="/">Translate</Link>
        <Link className="px-3" to="/history">History</Link>
        <Link className="px-3" to="/login">Login</Link>
      </nav>
    </header>
  );
}
