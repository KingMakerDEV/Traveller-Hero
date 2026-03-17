import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  // Redirect component — HomePage is the real landing page
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Link to="/" />
    </motion.div>
  );
};

export default Index;
