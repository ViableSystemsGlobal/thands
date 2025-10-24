
import React from "react";
import { motion } from "framer-motion";

const About = () => {
  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-light mb-12 font-serif tracking-wide text-center">
            About Tailored Hands
          </h1>

          {/* Introduction */}
          <div className="mb-16">
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Tailored Hands is more than a modern fashion brand—it's a bold movement to redefine formal wear in Africa and beyond. Our journey began not just as a business idea, but as a calling rooted in purpose and passion.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Grounded in African identity and inspired by a higher mission, we create distinctive, ready-to-wear pieces that embody culture, confidence, and class.
            </p>
          </div>

          {/* Core Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center p-6 bg-white rounded-lg shadow-lg"
            >
              <h3 className="text-xl font-medium mb-4">Craftsmanship</h3>
              <p className="text-gray-600">
                Blending authentic African craftsmanship with premium kaftan fabrics, our designs are crafted for those who seek to stand out while honoring their roots.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-6 bg-white rounded-lg shadow-lg"
            >
              <h3 className="text-xl font-medium mb-4">Impact</h3>
              <p className="text-gray-600">
                We drive change by providing dignified employment opportunities for tailors and designers, and by building inclusive workspaces that welcome persons with disabilities.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-6 bg-white rounded-lg shadow-lg"
            >
              <h3 className="text-xl font-medium mb-4">Innovation</h3>
              <p className="text-gray-600">
                Rather than following fleeting trends, we forge our own path—believing that true style is not about perfection, but about authenticity and originality.
              </p>
            </motion.div>
          </div>

          {/* Mission Section */}
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-light mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                We operate on a hybrid model that fuses profit with purpose. Our work is aligned with global sustainable development goals, promoting decent work, economic growth, and reduced inequalities.
              </p>
            </motion.div>
          </div>

          {/* Vision Section */}
          <div className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-light mb-6">Our Vision</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Looking ahead, we aspire to become one of Africa's most iconic fashion houses—expanding into women's wear, fabric production, and more. Our goal is to set a new global standard for formal wear, deeply rooted in African heritage and creative excellence.
              </p>
            </motion.div>
          </div>

          {/* Closing Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mt-12"
          >
            <p className="text-xl font-medium text-gray-800 italic">
              Join us on a journey where fashion meets faith, culture meets creativity, and every stitch tells a story.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
