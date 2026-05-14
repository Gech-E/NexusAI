#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <string>

#include "../recommendation-engine/include/recommender.hpp"
#include "../embedding-engine/include/embedder.hpp"
#include "../cv-monitor/include/cv_monitor.hpp"

namespace py = pybind11;
using namespace nexus::ai;

std::string get_engine_version() {
    return "1.0.0-alpha";
}

PYBIND11_MODULE(nexus_ai_bindings, m) {
    m.doc() = "Nexus LearnAI High-Performance C++ Engine Bindings";

    m.def("get_engine_version", &get_engine_version, "Get the native C++ engine version");

    // Recommender Bindings
    py::class_<StudentSkill>(m, "StudentSkill")
        .def(py::init<>())
        .def_readwrite("topic_id", &StudentSkill::topic_id)
        .def_readwrite("mastery_level", &StudentSkill::mastery_level);

    py::class_<Recommendation>(m, "Recommendation")
        .def(py::init<>())
        .def_readwrite("resource_id", &Recommendation::resource_id)
        .def_readwrite("topic_id", &Recommendation::topic_id)
        .def_readwrite("score", &Recommendation::score);

    py::class_<Recommender>(m, "Recommender")
        .def(py::init<>())
        .def("initialize", &Recommender::initialize, py::arg("model_path"))
        .def("generate_recommendations", &Recommender::generate_recommendations, 
             py::arg("student_id"), py::arg("current_skills"), py::arg("top_k") = 5);

    // Embedder Bindings
    py::class_<Embedder>(m, "Embedder")
        .def(py::init<>())
        .def("initialize", &Embedder::initialize, py::arg("model_path"))
        .def("embed_text", &Embedder::embed_text, py::arg("text"))
        .def("compute_similarity", &Embedder::compute_similarity, py::arg("emb1"), py::arg("emb2"));

    // CV Monitor Bindings
    py::class_<CVAlert>(m, "CVAlert")
        .def(py::init<>())
        .def_readwrite("student_id", &CVAlert::student_id)
        .def_readwrite("alert_type", &CVAlert::alert_type)
        .def_readwrite("confidence", &CVAlert::confidence)
        .def_readwrite("timestamp_ms", &CVAlert::timestamp_ms);

    py::class_<CVMonitor>(m, "CVMonitor")
        .def(py::init<>())
        .def("initialize", &CVMonitor::initialize, py::arg("config_path"))
        .def("process_frame", &CVMonitor::process_frame, 
             py::arg("student_id"), py::arg("image_buffer"), py::arg("width"), py::arg("height"));
}
