import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
}

export default function SplashScreen({ children }: Props) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>

        {loading && (

          <motion.div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050816]"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: {
                duration: .8
              }
            }}
          >

            <motion.div

              initial={{
                scale: .4,
                rotateY: -180,
                opacity: 0
              }}

              animate={{
                scale: 1,
                rotateY: 0,
                opacity: 1
              }}

              transition={{
                duration: 1.4
              }}

              className="relative"

            >

              <motion.div

                animate={{
                  rotateY: 360
                }}

                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear"
                }}

                className="flex h-40 w-40 items-center justify-center rounded-[40px] bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-700 text-7xl font-black text-white shadow-[0_0_80px_rgba(37,99,235,.7)]"

              >

                C

              </motion.div>

            </motion.div>

            <motion.h1

              initial={{
                opacity:0,
                y:30
              }}

              animate={{
                opacity:1,
                y:0
              }}

              transition={{
                delay:1
              }}

              className="mt-12 text-5xl font-black tracking-[10px] text-white"

            >

              COSMO

            </motion.h1>

            <motion.p

              initial={{
                opacity:0
              }}

              animate={{
                opacity:1
              }}

              transition={{
                delay:1.4
              }}

              className="mt-3 text-xl text-blue-300"

            >

              Business AI

            </motion.p>

            <motion.p

              initial={{
                opacity:0
              }}

              animate={{
                opacity:1
              }}

              transition={{
                delay:1.8
              }}

              className="mt-10 text-slate-500"

            >

              O futuro da gestão começa aqui.

            </motion.p>

          </motion.div>

        )}

      </AnimatePresence>

      {children}

    </>
  );
}