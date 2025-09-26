const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async findAll(conditions = {}, orderBy = 'created_at DESC', limit = null) {
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    query += ` ORDER BY ${orderBy}`;

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  async findById(id) {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  async create(data) {
    if (!data.id) {
      data.id = uuidv4();
    }

    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    data.updated_at = new Date();

    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns
      .map((col, index) => `${col} = $${index + 1}`)
      .join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = $${values.length + 1}
      RETURNING *
    `;

    const result = await db.query(query, [...values, id]);
    return result.rows[0];
  }

  async delete(id) {
    const result = await db.query(
      `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async count(conditions = {}) {
    let query = `SELECT COUNT(*) FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

module.exports = BaseModel;