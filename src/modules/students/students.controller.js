'use strict';

const service = require('./students.service');

async function create(req, res) {
  const student = await service.createStudent(req.school, req.body, req.user, req.ip);
  res.status(201).json({ student });
}

async function list(req, res) {
  const students = await service.listStudents(req.school.id, {
    q: req.query.q,
    limit: req.query.limit,
    offset: req.query.offset
  });
  res.json({ students });
}

async function get(req, res) {
  const student = await service.getStudent(req.school.id, req.params.id);
  res.json({ student });
}

async function update(req, res) {
  const student = await service.updateStudent(req.school.id, req.params.id, req.body, req.user);
  res.json({ student });
}

async function remove(req, res) {
  await service.deleteStudent(req.school.id, req.params.id, req.user);
  res.status(204).end();
}

module.exports = { create, list, get, update, remove };
